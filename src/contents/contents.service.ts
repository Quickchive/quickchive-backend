import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  CACHE_MANAGER,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as cheerio from 'cheerio';
import axios from 'axios';
import {
  AddCategoryBodyDto,
  AddCategoryOutput,
  RecentCategoryList,
  DeleteCategoryOutput,
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
} from './dtos/category.dto';
import {
  AddContentBodyDto,
  AddContentOutput,
  AddMultipleContentsBodyDto,
  checkReadFlagOutput,
  DeleteContentOutput,
  SummarizeContentBodyDto,
  SummarizeContentOutput,
  toggleFavoriteOutput,
  UpdateContentBodyDto,
} from './dtos/content.dto';
import {
  LoadPersonalCategoriesOutput,
  LoadRecentCategoriesOutput,
} from './dtos/load-personal-categories.dto';
import { SummaryService } from '../summary/summary.service';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';
import { CategoryRepository } from './repository/category.repository';
import { categoryCountExpirationInCache } from './contents.module';
import { Cache } from 'cache-manager';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Content)
    private readonly contents: Repository<Content>,
    private readonly summaryService: SummaryService,
    @InjectRepository(Category)
    private readonly categories: CategoryRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async addContent(
    user: User,
    {
      link,
      title,
      comment,
      deadline,
      favorite,
      categoryName,
      parentId,
    }: AddContentBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    try {
      const userInDb = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
          categories: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      // get og tag info from link
      const {
        title: linkTitle,
        siteName,
        description,
        coverImg,
      } = await this.getLinkInfo(link);
      title = title ? title : linkTitle;

      const category = await this.getOrCreateCategory(
        categoryName,
        parentId,
        userInDb,
        queryRunnerManager,
      );

      await this.checkContentDuplicateAndPlusCategoryCount(
        link,
        category,
        userInDb,
      );

      const newContent = queryRunnerManager.create(Content, {
        link,
        title,
        siteName,
        coverImg,
        description,
        comment,
        deadline,
        category,
        user,
        ...(favorite && { favorite }),
      });
      await queryRunnerManager.save(newContent);

      return;
    } catch (e) {
      throw e;
    }
  }

  async addMultipleContents(
    user: User,
    { contentLinks }: AddMultipleContentsBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: true,
          categories: true,
        },
      });

      if (contentLinks.length > 0) {
        for (const link of contentLinks) {
          const { title, description, coverImg, siteName } =
            await this.getLinkInfo(link);

          // Check if content already exists in same category
          if (
            userInDb.contents.filter(
              (content) => content.link === link && !content.category,
            )[0]
          ) {
            throw new ConflictException(
              `Content with ${link} already exists in same category.`,
            );
          }

          const newContent = queryRunnerManager.create(Content, {
            link,
            title,
            siteName,
            coverImg,
            description,
            user: userInDb,
          });
          await queryRunnerManager.save(newContent);
        }
      }

      return;
    } catch (e) {
      throw e;
    }
  }

  async updateContent(
    user: User,
    {
      id: contentId,
      link,
      title,
      description,
      comment,
      deadline,
      favorite,
      categoryName,
      parentId,
    }: UpdateContentBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    const newContentObj = {
      link,
      title,
      description,
      comment,
      deadline,
      favorite,
    };
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
          categories: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content = userInDb.contents.filter(
        (content) => content.id === contentId,
      )[0];
      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      const category = await this.getOrCreateCategory(
        categoryName,
        parentId,
        userInDb,
        queryRunnerManager,
      );

      await this.checkContentDuplicateAndPlusCategoryCount(
        link,
        category,
        userInDb,
      );

      await queryRunnerManager.save(Content, [
        { id: content.id, ...newContentObj, ...(category && { category }) },
      ]);

      return;
    } catch (e) {
      throw e;
    }
  }

  async toggleFavorite(
    user: User,
    contentId: number,
    queryRunnerManager: EntityManager,
  ): Promise<toggleFavoriteOutput> {
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content = userInDb.contents.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      content.favorite = !content.favorite;
      await queryRunnerManager.save(content);

      return;
    } catch (e) {
      throw e;
    }
  }

  async readContent(
    user: User,
    contentId: number,
  ): Promise<checkReadFlagOutput> {
    try {
      const userInDb = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content = userInDb.contents.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      content.readFlag = true;

      await this.contents.save(content);

      return;
    } catch (e) {
      throw e;
    }
  }

  async deleteContent(
    user: User,
    contentId: number,
    queryRunnerManager: EntityManager,
  ): Promise<DeleteContentOutput> {
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: true,
          categories: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content = userInDb.contents.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      // delete content
      await queryRunnerManager.delete(Content, content.id);

      return;
    } catch (e) {
      throw e;
    }
  }

  /**
   * category를 생성하거나, 이미 존재하는 category를 가져옴
   * content service의 method 내에서 중복되는 로직을 분리함
   *
   * @param link
   * @param categoryName
   * @param parentId
   * @param userInDb
   * @param queryRunnerManager
   * @returns category
   */
  async getOrCreateCategory(
    // link: string,
    categoryName: string,
    parentId: number,
    userInDb: User,
    queryRunnerManager: EntityManager,
  ): Promise<Category> {
    // generate category name and slug
    const { categoryName: refinedCategoryName, categorySlug } =
      this.categories.generateNameAndSlug(categoryName);

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
  }

  /**
   * 대 카테고리를 기준으로 중복 체크하고,
   * 최상위 카테고리의 카운트를 올려줌
   *
   * @param link
   * @param category
   * @param userInDb
   */
  async checkContentDuplicateAndPlusCategoryCount(
    link: string,
    category: Category,
    userInDb: User,
  ): Promise<void> {
    // TODO : 대 카테고리를 기준으로 중복 체크해야함.

    // 최상위 카테고리부터 시작해서 하위 카테고리까지의 그룹을 찾아옴
    const categoryFamily = this.categories.findCategoryFamily(
      userInDb.categories,
      category,
    );

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
     * 최상위 카테고리의 count를 증가시킨 후, 해당 카테고리를 저장함
     */

    // 최상위 카테고리의 children을 제거함
    delete categoryFamily[0].children;
    const updatedTopCategory: Category = categoryFamily[0];

    // 캐시 내의 saves 카운트 증가
    let categoryCount: RecentCategoryList[] = await this.cacheManager.get(
      userInDb.id,
    );

    // 캐시에 저장된 카테고리 카운트가 없다면, 새로운 배열을 만들어줌
    categoryCount = categoryCount ? categoryCount : [];

    // 캐시에 저장된 카테고리 카운트가 있다면, 해당 카테고리 카운트를 증가시킴
    if (
      categoryCount.find(
        (categoryCountInDb) =>
          categoryCountInDb.categoryId === updatedTopCategory.id,
      )
    ) {
      categoryCount.forEach((categoryCountInDb) => {
        if (categoryCountInDb.categoryId === updatedTopCategory.id) {
          categoryCountInDb.categorySaves++;
        }
      });
    }
    // 캐시에 저장된 카테고리 카운트가 없다면, 새로운 카테고리 카운트를 만들어주고 기존 것과 합쳐줌
    else {
      categoryCount.push({
        categoryId: updatedTopCategory.id,
        categorySaves: 1,
      });
    }
    this.cacheManager.set(userInDb.id, categoryCount, {
      ttl: categoryCountExpirationInCache,
    });
  }

  async getLinkInfo(link: string) {
    let title: string = '';
    let coverImg: string = '';
    let description: string = '';
    let siteName: string = null;

    await axios
      .get(link)
      .then((res) => {
        if (res.status !== 200) {
          console.log(res.status);
          throw new BadRequestException('잘못된 링크입니다.');
        } else {
          const data = res.data;
          if (typeof data === 'string') {
            const $ = cheerio.load(data);
            title = $('title').text() !== '' ? $('title').text() : 'Untitled';
            $('meta').each((i, el) => {
              const meta = $(el);
              if (meta.attr('property') === 'og:image') {
                coverImg = meta.attr('content');
              }
              if (meta.attr('property') === 'og:description') {
                description = meta.attr('content');
              }
              if (meta.attr('property') === 'og:site_name') {
                siteName = meta.attr('content');
              }
            });
          }
        }
      })
      .catch((e) => {
        console.log(e.message);
        // Control unreachable link
        // if(e.message === 'Request failed with status code 403') {
        // 403 에러가 발생하는 링크는 크롤링이 불가능한 링크이다.
        // }
        for (let idx = 1; idx < 3; idx++) {
          if (link.split('/').at(-idx) !== '') {
            title = link.split('/').at(-idx);
            break;
          }
        }
        title = title ? title : 'Untitled';
      });

    return {
      title,
      description,
      coverImg,
      siteName,
    };
  }

  async summarizeContent(
    user: User,
    contentId: number,
  ): Promise<SummarizeContentOutput> {
    try {
      const userInDb = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content: Content = userInDb.contents.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      // 문서 요약을 위한 본문 크롤링
      let document: string = await this.summaryService.getDocument(
        content.link,
      );

      // 크롤링 후 처리
      let summary: string = '';
      if (!document) {
        throw new BadRequestException('Document not found.');
      } else if (document.length > 1900) {
        let sliceIndex: number = 0;
        for (let i = 0; i < Math.ceil(document.length / 1900); i++) {
          const slicedSummary = await this.summaryService.summaryContent({
            title: content?.title,
            content: document.slice(sliceIndex, sliceIndex + 1900),
          });
          summary += slicedSummary.summary;
          sliceIndex += 1900;
        }
      } else if (document.length <= 1900) {
        ({ summary } = await this.summaryService.summaryContent({
          title: content?.title,
          content: document,
        }));
      }

      return { summary };
    } catch (e) {
      throw e;
    }
  }

  async testSummarizeContent({
    title,
    content: document,
  }: SummarizeContentBodyDto): Promise<SummarizeContentOutput> {
    try {
      let summary: string = '';

      if (document.length > 1900) {
        let sliceIndex: number = 0;
        for (let i = 0; i < Math.ceil(document.length / 1900); i++) {
          const slicedSummary = await this.summaryService.summaryContent({
            title,
            content: document.slice(sliceIndex, sliceIndex + 1900),
          });
          summary += slicedSummary.summary;
          sliceIndex += 1900;
        }
      } else if (document.length <= 1900) {
        ({ summary } = await this.summaryService.summaryContent({
          title,
          content: document,
        }));
      }

      return { summary };
    } catch (e) {
      throw e;
    }
  }
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: CategoryRepository,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async addCategory(
    user: User,
    { categoryName: name, parentId }: AddCategoryBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddCategoryOutput> {
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          categories: true,
        },
      });
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const { categoryName, categorySlug } =
        this.categories.generateNameAndSlug(name);

      // check if category exists in user's categories(check if category name is duplicated in same level too)
      const category = userInDb.categories.find(
        (category) =>
          category.slug === categorySlug && category.parentId === parentId,
      );

      // if category doesn't exist, create it
      if (category) {
        throw new ConflictException('Category already exists');
      } else {
        // if parent category exists, get parent category
        const parentCategory: Category = parentId
          ? await queryRunnerManager.findOne(Category, {
              where: { id: parentId },
            })
          : null;
        // if parent category doesn't exist, throw error
        if (!parentCategory && parentId) {
          throw new NotFoundException('Parent category not found');
        }

        const category = await queryRunnerManager.save(
          queryRunnerManager.create(Category, {
            slug: categorySlug,
            name: categoryName,
            parentId: parentCategory ? parentCategory.id : null,
            user: userInDb,
          }),
        );

        userInDb.categories.push(category);
        await queryRunnerManager.save(userInDb);
      }

      return;
    } catch (e) {
      throw e;
    }
  }

  async updateCategory(
    user: User,
    { categoryId, name }: UpdateCategoryBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<UpdateCategoryOutput> {
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
          categories: true,
        },
      });
      // Check if user exists
      if (!userInDb) {
        throw new NotFoundException('User not found.');
      }

      const category = userInDb.categories.find(
        (category) => category.id === categoryId,
      );

      // Check if user has category with same slug
      const { categoryName, categorySlug } =
        this.categories.generateNameAndSlug(name);
      if (
        userInDb.categories.filter(
          (category) =>
            category.slug === categorySlug && category.id !== categoryId,
        )[0]
      ) {
        throw new NotFoundException(
          'Category with that name already exists in current user.',
        );
      }

      // Update category
      category.name = categoryName;
      category.slug = categorySlug;
      await queryRunnerManager.save(category);

      return;
    } catch (e) {
      throw e;
    }
  }

  async deleteCategory(
    user: User,
    categoryId: number,
    queryRunnerManager: EntityManager,
  ): Promise<DeleteCategoryOutput> {
    try {
      const category = await queryRunnerManager.findOne(Category, {
        where: { id: categoryId, userId: user.id },
      });

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      await queryRunnerManager.delete(Category, { id: categoryId });

      return;
    } catch (e) {
      throw e;
    }
  }

  async loadPersonalCategories(
    user: User,
  ): Promise<LoadPersonalCategoriesOutput> {
    try {
      const { categories } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          categories: true,
        },
      });

      // make categories tree by parentid
      const categoriesTree = this.categories.generateCategoriesTree(categories);

      return {
        categoriesTree,
      };
    } catch (e) {
      throw e;
    }
  }

  async loadRecentCategories(user: User): Promise<LoadRecentCategoriesOutput> {
    try {
      interface RecentCategoryListWithSaveCount extends RecentCategoryList {
        saveCount: number;
      }
      // 캐시 내의 카테고리 리스트를 가져온다.
      const recentCategoryList: RecentCategoryList[] =
        await this.cacheManager.get(user.id);

      // 2일 내의 데이터만 남긴 후 캐시 저장소에 반영한다.
      const time: Date = new Date();
      time.setDate(time.getDate() - 2);
      if (recentCategoryList) {
        recentCategoryList.filter((category) => time < category.savedAt);
      }
      this.cacheManager.set(user.id, recentCategoryList, {
        ttl: categoryCountExpirationInCache,
      });

      // 캐시 내의 카테고리 리스트를 최신 순으로 정렬하고, 동시에 저장된 횟수를 추가한다.
      const recentCategoriesWithSaveCount: RecentCategoryListWithSaveCount[] =
        [];
      if (recentCategoryList) {
        for (let i = 0; i < recentCategoryList.length; i++) {
          const inNewList = recentCategoriesWithSaveCount.find(
            (category) =>
              category.categoryId === recentCategoryList[i].categoryId,
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
      } else {
        return {
          recentCategories: [],
        };
      }

      // 최근 저장 순
      const orderByDate: number[] = recentCategoriesWithSaveCount.map(
        (category) => category.categoryId,
      );
      // 저장된 횟수 순
      const orderBySaveCount: RecentCategoryListWithSaveCount[] =
        recentCategoriesWithSaveCount.sort((a, b) => b.saveCount - a.saveCount);

      const recentCategories: Category[] = [];

      /*
       * 2번째 카테고리까지 선정 기준
       * 1. 저장 횟수 순
       * 2. 저장 횟수 동일 시, 최근 저장 순
       */
      for (let i = 0; i < 2; i++) {
        if (i < orderBySaveCount.length) {
          const category = await this.categories.findOne({
            where: { id: orderBySaveCount[i].categoryId },
          });

          // orderByDate에서 제거
          orderByDate.splice(
            orderByDate.findIndex(
              (categoryId) => categoryId === orderBySaveCount[i].categoryId,
            ),
            1,
          );

          if (category) {
            recentCategories.push(category);
          }
        }
      }

      /*
       * 나머지 3-n 개 선정 기준
       * 1. 최근 저장 순
       */
      const N = 3 - recentCategories.length;
      for (let i = 0; i < N; i++) {
        if (i < orderByDate.length) {
          const category = await this.categories.findOne({
            where: { id: orderByDate[i] },
          });

          if (category) {
            recentCategories.push(category);
          }
        }
      }

      return {
        recentCategories,
      };
    } catch (e) {
      throw e;
    }
  }
}
