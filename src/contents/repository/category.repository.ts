import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryNameAndSlug, CategoryTreeNode } from '../dtos/category.dto';
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
}

type CustomCategoryRepository = Pick<
  CategoryRepository,
  'generateNameAndSlug' | 'generateCategoriesTree' | 'findCategoryFamily'
>;

export const customCategoryRepositoryMethods: CustomCategoryRepository = {
  generateNameAndSlug(name: string): CategoryNameAndSlug {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    return { categoryName, categorySlug };
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
};

// export const customCategoryRepository = AppDataSource.getRepository(
//   Category,
// ).extend({
//   generateNameAndSlug(name: string): CategoryNameAndSlug {
//     const categoryName = name.trim().toLowerCase();
//     const categorySlug = categoryName.replace(/ /g, '-');

//     return { categoryName, categorySlug };
//   },

//   // make categories tree by parentId
//   generateCategoriesTree(categories: Category[]): CategoryTreeNode[] {
//     const categoriesTree: CategoryTreeNode[] = categories;
//     categoriesTree.reduce((acc, cur) => {
//       if (cur.parentId) {
//         const parent = categoriesTree.find(
//           (category) => category.id === cur.parentId,
//         );
//         if (parent) {
//           if (!parent.children) parent.children = [];
//           parent.children.push(cur);
//           categoriesTree.splice(categoriesTree.indexOf(cur), 1);
//         }
//       }
//       return acc;
//     });

//     return categoriesTree;
//   },

//   findTopParentCategory(categories: Category[], category: Category): number {
//     if (category.parentId) {
//       const parent = categories.find((c) => c.id === category.parentId);
//       if (parent) {
//         return findTopParentCategory(categories, parent);
//       }
//     } else {
//       return category.id;
//     }
//   },
// });

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
