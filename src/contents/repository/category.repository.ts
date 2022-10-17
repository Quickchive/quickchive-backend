import { EntityManager, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

export interface CategoryRepository extends Repository<Category> {
  this: Repository<Category>;

  getOrCreate(
    name: string,
    queryRunnerManager: EntityManager,
  ): Promise<Category>;
}

type CustomCategoryRepository = Pick<CategoryRepository, 'getOrCreate'>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  async getOrCreate(
    name: string,
    queryRunnerManager: EntityManager,
  ): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await queryRunnerManager.findOneBy(Category, {
      slug: categorySlug,
    });

    if (!category) {
      category = await queryRunnerManager.save(
        queryRunnerManager.create(Category, {
          slug: categorySlug,
          name: categoryName,
        }),
      );
    }

    return category;
  },
};
