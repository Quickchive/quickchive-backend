import { Category } from '../category.entity';
import {
  CategorySlug,
  CategoryTreeNode,
  RecentCategoryList,
  RecentCategoryListWithSaveCount,
} from '../dtos/category.dto';
import { User } from '../../users/entities/user.entity';
import { ConflictException } from '@nestjs/common';

import * as fs from 'fs';

export const generateSlug = (name: string): CategorySlug => {
  const categoryName = name.trim().toLowerCase();
  const categorySlug = categoryName.replace(/ /g, '-');

  return { categorySlug };
};

// make categories tree by parentId
export const generateCategoriesTree = (
  categories: Category[],
): CategoryTreeNode[] => {
  const categoriesTree: CategoryTreeNode[] = categories;
  for (let i = 0; i < categoriesTree.length; i++) {
    if (categoriesTree[i].parentId) {
      // 세세부 카테고리 우선 작업
      const parent = categoriesTree.find(
        (category) =>
          category.id === categoriesTree[i].parentId && category.parentId,
      );
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(categoriesTree[i]);
        categoriesTree.splice(i, 1);
        i--;
      }
    }
  }

  for (let i = 0; i < categoriesTree.length; i++) {
    if (categoriesTree[i].parentId) {
      // 중간 카테고리 작업(세부 카테고리)
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

export const findCategoryFamily = (
  categories: Category[] | undefined,
  category: Category,
): CategoryTreeNode[] => {
  if (!categories) return [category];

  const topParentId = findTopParentCategory(categories, category);
  const categoriesTree: CategoryTreeNode[] = generateCategoriesTree(categories);

  return categoriesTree.filter((category) => category.id === topParentId);
};

/**
 * 대 카테고리를 기준으로 중복 체크하고,
 * 최상위 카테고리의 카운트를 올려줌
 *
 * @param link
 * @param category
 * @param userInDb
 */
export const checkContentDuplicateAndAddCategorySaveLog = async (
  link: string | undefined,
  category: Category,
  userInDb: User,
): Promise<void> => {
  // 최상위 카테고리부터 시작해서 하위 카테고리까지의 그룹을 찾아옴
  const categoryFamily: CategoryTreeNode[] = findCategoryFamily(
    userInDb?.categories,
    category,
  );

  /*
   * 카테고리의 중복을 체크하고, 중복이 없다면 최상위 카테고리의 count를 증가시킴
   */

  // 카테고리 그룹을 flat 시킴
  const flatDeep = (arr: CategoryTreeNode[], d: number): CategoryTreeNode[] => {
    return d > 0
      ? arr.reduce((acc: CategoryTreeNode[], cur) => {
          const forConcat = [cur];
          return acc.concat(
            cur.children
              ? forConcat.concat(flatDeep(cur.children, d - 1))
              : cur,
          );
        }, [])
      : arr.slice();
  };

  const flatCategoryFamily: CategoryTreeNode[] = flatDeep(
    categoryFamily,
    Infinity,
  );

  // 유저의 대 category 내에 같은 link로 된 content가 있는지 체크
  if (userInDb.contents) {
    for (const contentInFilter of userInDb.contents) {
      if (
        contentInFilter.link === link &&
        flatCategoryFamily.filter(
          (categoryInFamily) =>
            categoryInFamily.id === contentInFilter.category?.id,
        ).length > 0
      ) {
        throw new ConflictException(
          'Content with that link already exists in same category family.',
        );
      }
    }
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
  new Promise<void>((resolve, reject) => {
    fs.appendFile(
      `${__dirname}/../../../user_logs/${userInDb.id}.txt`,
      log,
      (err) => {
        if (err) {
          reject();
        }
        resolve();
      },
    );
  });
};

/**
 * 파일에서 로그를 불러오는 함수
 * @param id
 * @returns RecentCategoryList[]
 */
export const loadLogs = (id: number): RecentCategoryList[] => {
  const logList: string[] = fs
    .readFileSync(`${__dirname}/../../user_logs/${id}.txt`)
    .toString()
    .split('\n');
  logList.pop(); // 마지막 줄은 빈 줄이므로 제거

  // logList를 RecentCategoryList[]로 변환
  const recentCategoryList: RecentCategoryList[] = logList.map((str) => {
    const categoryId = +str.split('"categoryId": ')[1].split(',')[0];
    const savedAt = +str.split('"savedAt": ')[1].split('}')[0];
    return {
      categoryId,
      savedAt,
    };
  });

  // 최신 순으로 정렬 후 반환
  return recentCategoryList.reverse();
};

/**
 * 불러온 로그를 바탕으로 카테고리당 저장된 카운트와 함께 배열을 만드는 함수(매번 10개씩 조회한다.)
 * @param recentCategoryList
 * @param recentCategoriesWithSaveCount
 * @param till
 * @returns
 */
export const makeCategoryListWithSaveCount = (
  recentCategoryList: RecentCategoryList[],
  recentCategoriesWithSaveCount: RecentCategoryListWithSaveCount[],
  till: number,
): RecentCategoryListWithSaveCount[] => {
  const start: number = till - 10;
  const end: number = till;
  for (let i = start; i < end && i < recentCategoryList.length; i++) {
    const inNewList = recentCategoriesWithSaveCount.find(
      (category) => category.categoryId === recentCategoryList[i].categoryId,
    );
    if (inNewList) {
      inNewList.saveCount++;
    } else {
      recentCategoriesWithSaveCount.push({
        ...recentCategoryList[i],
        saveCount: 1,
      });
    }
  }

  return recentCategoriesWithSaveCount;
};

export const findTopParentCategory = (
  categories: Category[],
  category: Category,
): number => {
  if (category.parentId) {
    const parent = categories.find((c) => c.id === category.parentId);
    if (parent) {
      return findTopParentCategory(categories, parent);
    }
  }

  return category.id;
};
