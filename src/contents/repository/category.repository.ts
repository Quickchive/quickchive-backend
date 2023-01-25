import { EntityManager, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryNameAndSlug, CategoryTreeNode } from '../dtos/category.dto';
import { User } from '../../users/entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

import * as fs from 'fs';

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

  checkContentDuplicateAndAddCategorySaveLog(
    link: string,
    category: Category,
    userInDb: User,
  ): Promise<void>;
}

type CustomCategoryRepository = Pick<
  CategoryRepository,
  | 'generateNameAndSlug'
  | 'generateCategoriesTree'
  | 'findCategoryFamily'
  | 'getOrCreateCategory'
  | 'checkContentDuplicateAndAddCategorySaveLog'
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
    return findCategoryFamily(categories, category);
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

  /**
   * 대 카테고리를 기준으로 중복 체크하고,
   * 최상위 카테고리의 카운트를 올려줌
   *
   * @param link
   * @param category
   * @param userInDb
   */
  async checkContentDuplicateAndAddCategorySaveLog(
    link: string,
    category: Category,
    userInDb: User,
  ): Promise<void> {
    // 최상위 카테고리부터 시작해서 하위 카테고리까지의 그룹을 찾아옴
    const categoryFamily = findCategoryFamily(userInDb.categories, category);

    /*
     * 카테고리의 중복을 체크하고, 중복이 없다면 최상위 카테고리의 count를 증가시킴
     */

    // flat categoryFamily with children
    categoryFamily.reduce((acc, cur) => {
      acc.push(cur);
      if (cur.children) {
        acc.push(cur.children.reduce);
      }
      return acc;
    }, []);
    const flatDeep = (arr, d) => {
      return d > 0
        ? arr.reduce((acc, cur) => {
            const forConcat = [cur];
            return acc.concat(
              cur.children
                ? forConcat.concat(flatDeep(cur.children, d - 1))
                : cur,
            );
          }, [])
        : arr.slice();
    };

    const flatCategoryFamily = flatDeep(categoryFamily, Infinity);

    const contentThatSameLinkAndCategory = userInDb.contents.find(
      (contentInFilter) =>
        contentInFilter.link === link &&
        flatCategoryFamily.filter(
          (categoryInFamily) =>
            categoryInFamily.id === contentInFilter.category.id,
        ).length > 0,
    );
    if (contentThatSameLinkAndCategory) {
      throw new ConflictException(
        'Content with that link already exists in same category family.',
      );
    }

    /*
     * 최상위 카테고리의 count를 증가시킨 후,
     * 해당 카테고리의 저장 기록을 유저 로그 파일에 추가함
     */

    // 최상위 카테고리 분리
    const updatedTopCategory: Category = categoryFamily[0];

    // 최상위 카테고리의 count 증가
    const log = `{"categoryId": ${
      updatedTopCategory.id
    },"savedAt": ${new Date().getTime()}}\n`;

    // 유저 로그 파일에 로그 추가
    fs.appendFileSync(
      `${__dirname}/../../../user_logs/${userInDb.id}.txt`,
      log,
    );
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

const findCategoryFamily = (
  categories: Category[],
  category: Category,
): CategoryTreeNode[] => {
  const topParentId = findTopParentCategory(categories, category);
  const categoriesTree: CategoryTreeNode[] = generateCategoriesTree(categories);

  return categoriesTree.filter((category) => category.id === topParentId);
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
