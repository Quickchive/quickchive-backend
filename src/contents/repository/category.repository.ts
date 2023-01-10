import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryNameAndSlug } from '../dtos/category.dto';

export interface CategoryRepository extends Repository<Category> {
  // this: Repository<Category>;

  generateNameAndSlug(name: string): CategoryNameAndSlug;
}

type CustomCategoryRepository = Pick<CategoryRepository, 'generateNameAndSlug'>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  generateNameAndSlug(name: string): CategoryNameAndSlug {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    return { categoryName, categorySlug };
  },
};
