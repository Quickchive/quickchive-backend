import { EntityManager, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryNameAndSlug, CategoryTreeNode } from '../dtos/category.dto';
import { User } from '../../users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
// import { AppDataSource } from 'src/database/ormconfig';

export interface CategoryRepository extends Repository<Category> {
  // this: Repository<Category>;

  generateNameAndSlug(name: string): CategoryNameAndSlug;

  // make categories tree by parentId
  generateCategoriesTree(categories: Category[]): CategoryTreeNode[];

  findCategoryFamily(
    categories: Category[],
    category: Category,
  ): CategoryTreeNode[];

  getOrCreateCategory(
    // link: string,
    categoryName: string,
    parentId: number,
    userInDb: User,
    queryRunnerManager: EntityManager,
  ): Promise<Category>;
}

type CustomCategoryRepository = Pick<
  CategoryRepository,
  | 'generateNameAndSlug'
  | 'generateCategoriesTree'
  | 'findCategoryFamily'
  | 'getOrCreateCategory'
>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  generateNameAndSlug(name: string): CategoryNameAndSlug {
    return generateNameAndSlug(name);
  },

  // make categories tree by parentId
  generateCategoriesTree(categories: Category[]): CategoryTreeNode[] {
    return generateCategoriesTree(categories);
  },

  findCategoryFamily(
    categories: Category[],
    category: Category,
  ): CategoryTreeNode[] {
    const topParentId = findTopParentCategory(categories, category);
    const categoriesTree: CategoryTreeNode[] =
      generateCategoriesTree(categories);

    return categoriesTree.filter((category) => category.id === topParentId);
  },

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
    parentId: number,
    userInDb: User,
    queryRunnerManager: EntityManager,
  ): Promise<Category> {
    // generate category name and slug
    const { categoryName: refinedCategoryName, categorySlug } =
      generateNameAndSlug(categoryName);

    // if parent id is undefined, set it to null to avoid bug caused by type mismatch
    if (!parentId) parentId = null;
    // check if category exists in user's categories
    let category: Category = userInDb.categories.find(
      (category) =>
        category.slug === categorySlug && category.parentId === parentId,
    );

    // if category doesn't exist, create it
    if (!category) {
      // if parent id exists, get parent category
      const parentCategory: Category = parentId
        ? await queryRunnerManager.findOne(Category, {
            where: { id: parentId },
          })
        : null;
      // if parent category doesn't exist, throw error
      if (!parentCategory && parentId) {
        throw new NotFoundException('Parent category not found');
      }

      category = await queryRunnerManager.save(
        queryRunnerManager.create(Category, {
          slug: categorySlug,
          name: refinedCategoryName,
          parentId: parentCategory ? parentCategory.id : null,
          user: userInDb,
        }),
      );

      userInDb.categories.push(category);
      await queryRunnerManager.save(userInDb);
    }

    return category;
  },
};

const generateNameAndSlug = (name: string): CategoryNameAndSlug => {
  const categoryName = name.trim().toLowerCase();
  const categorySlug = categoryName.replace(/ /g, '-');

  return { categoryName, categorySlug };
};

const generateCategoriesTree = (categories: Category[]): CategoryTreeNode[] => {
  const categoriesTree: CategoryTreeNode[] = categories;
  for (let i = 0; i < categoriesTree.length; i++) {
    if (categoriesTree[i].parentId) {
      const parent = categoriesTree.find(
        (category) => category.id === categoriesTree[i].parentId,
      );
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(categoriesTree[i]);
        categoriesTree.splice(i, 1);
        i--;
      }
    }
  }

  return categoriesTree;
};

const findTopParentCategory = (
  categories: Category[],
  category: Category,
): number => {
  if (category.parentId) {
    const parent = categories.find((c) => c.id === category.parentId);
    if (parent) {
      return findTopParentCategory(categories, parent);
    }
  } else {
    return category.id;
  }
};
