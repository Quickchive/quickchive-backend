import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { categoryNameAndSlug } from '../dtos/category.dto';

export interface CategoryRepository extends Repository<Category> {
  this: Repository<Category>;

  generateNameAndSlug(name: string): categoryNameAndSlug;
}

type CustomCategoryRepository = Pick<CategoryRepository, 'generateNameAndSlug'>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  generateNameAndSlug(name: string): categoryNameAndSlug {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    return { categoryName, categorySlug };
  },
};
