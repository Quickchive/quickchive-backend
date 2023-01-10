import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryNameAndSlug, CategoryTreeNode } from '../dtos/category.dto';

export interface CategoryRepository extends Repository<Category> {
  // this: Repository<Category>;

  generateNameAndSlug(name: string): CategoryNameAndSlug;

  // make categories tree by parentId
  generateCategoriesTree(categories: Category[]): CategoryTreeNode[];
}

type CustomCategoryRepository = Pick<
  CategoryRepository,
  'generateNameAndSlug' | 'generateCategoriesTree'
>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  generateNameAndSlug(name: string): CategoryNameAndSlug {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    return { categoryName, categorySlug };
  },

  // make categories tree by parentId
  generateCategoriesTree(categories: Category[]): CategoryTreeNode[] {
    const categoriesTree: CategoryTreeNode[] = categories;
    categoriesTree.reduce((acc, cur) => {
      if (cur.parentId) {
        const parent = categoriesTree.find(
          (category) => category.id === cur.parentId,
        );
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(cur);
          categoriesTree.splice(categoriesTree.indexOf(cur), 1);
        }
      }
      return acc;
    });

    return categoriesTree;
  },
};
