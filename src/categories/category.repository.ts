import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from './category.entity';
import { User } from '../users/entities/user.entity';
import { generateSlug } from './utils/category.util';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private readonly dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  async findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<Category | null> {
    return entityManager
      ? entityManager.findOneBy(Category, { id })
      : this.findOneBy({ id });
  }

  async createOne(
    category: Category & { parentId?: number | null },
    entityManager?: EntityManager,
  ): Promise<Category> {
    return entityManager ? entityManager?.save(category) : this.save(category);
  }

  /**
   * category를 생성하거나, 이미 존재하는 category를 가져옴
   * content service의 method 내에서 중복되는 로직을 분리함
   *
   * @param categoryName
   * @param parentId
   * @param userInDb
   * @param queryRunnerManager
   * @returns category
   */
  async getOrCreateCategory(
    categoryName: string,
    parentId: number | undefined,
    userInDb: User,
    entityManager?: EntityManager,
  ): Promise<Category> {
    // generate category name and slug
    const { categorySlug } = generateSlug(categoryName);

    if (parentId) {
      // category depth should be 3
      let currentParentId: number | undefined = parentId;
      let parentCategory: Category | null;
      for (let i = 0; i < 2; i++) {
        if (currentParentId === null) break;
        parentCategory = await this.findById(currentParentId, entityManager);
        if (i === 1 && parentCategory?.parentId !== null) {
          throw new ConflictException('Category depth should be 3');
        }
        if (parentCategory?.parentId)
          currentParentId = parentCategory?.parentId;
        else break;
      }
    }
    // check if category exists in user's categories
    const category = userInDb.categories?.find(
      (category) =>
        category.slug === categorySlug && category.parentId == parentId,
    );

    // if category doesn't exist, create it
    if (!category) {
      // if parent id exists, get parent category
      const parentCategory: Category | null = parentId
        ? await this.findById(parentId, entityManager)
        : null;
      // if parent category doesn't exist, throw error
      if (!parentCategory && parentId) {
        throw new NotFoundException('Parent category not found');
      }

      const newCategory = new Category();
      newCategory.slug = categorySlug;
      newCategory.name = categoryName;
      newCategory.parentId = parentCategory?.id;
      newCategory.user = userInDb;

      await this.createOne(newCategory, entityManager);
      userInDb.categories?.push(newCategory);

      return newCategory;
    }

    return category;
  }

  /**
   * 대 카테고리는 유저 당 10개까지만 생성 가능
   * 해당 유저의 대 카테고리 개수를 확인하고, 10개 이상이면 true 반환
   * @param user.id
   * @returns boolean
   */
  async isOverCategoryLimit(user: User): Promise<boolean> {
    const categoryCount = await this.createQueryBuilder('category')
      .where('category.userId = :id', { id: user.id })
      .andWhere('category.parentId IS NULL')
      .getCount();

    return categoryCount >= 10;
  }

  async createDefaultCategories(user: User): Promise<void> {
    const defaultCategories = ['꿀팁', '쇼핑'];

    await this.createQueryBuilder('category')
      .insert()
      .into(Category)
      .values(
        defaultCategories.map((categoryName) => ({
          name: categoryName,
          slug: generateSlug(categoryName).categorySlug,
          user: user,
        })),
      )
      .execute();
  }

  async findWithContents(userId: number): Promise<Category[]> {
    return this.find({
      where: {
        user: { id: userId },
      },
      relations: ['contents'],
    });
  }

  async findByUserId(userId: number): Promise<Category[]> {
    return await this.find({
      where: {
        user: { id: userId },
      },
    });
  }
}
