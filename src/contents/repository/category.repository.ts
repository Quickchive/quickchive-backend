import { EntityManager, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { categoryNameAndSlug } from '../dtos/category.dto';

export interface CategoryRepository extends Repository<Category> {
  this: Repository<Category>;

  checkAndCreate(
    user: User,
    name: string,
    queryRunnerManager: EntityManager,
  ): Promise<void>;

  generateNameAndSlug(name: string): categoryNameAndSlug;
}

type CustomCategoryRepository = Pick<
  CategoryRepository,
  'checkAndCreate' | 'generateNameAndSlug'
>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  /**
   * Check if category exists and
   * create or throw duplicate error
   */
  async checkAndCreate(
    user: User,
    name: string,
    queryRunnerManager: EntityManager,
  ): Promise<void> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    // let category = await queryRunnerManager.findOneBy(Category, {
    //   slug: categorySlug,
    // });

    // check if category exists in user's categories
    const category = user.categories.find(
      (category) => category.slug === categorySlug,
    );

    // if category doesn't exist, create it
    if (category) {
      throw new ConflictException('Category already exists');
    } else {
      const category = await queryRunnerManager.save(
        queryRunnerManager.create(Category, {
          slug: categorySlug,
          name: categoryName,
          user,
        }),
      );

      user.categories.push(category);
      await queryRunnerManager.save(user);
    }
  },

  generateNameAndSlug(name: string): categoryNameAndSlug {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    return { categoryName, categorySlug };
  },
};
