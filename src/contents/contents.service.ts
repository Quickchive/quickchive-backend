import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import {
  AddCategoryBodyDto,
  AddCategoryOutput,
  RecentCategoryList,
  DeleteCategoryOutput,
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
  RecentCategoryListWithSaveCount,
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

      let category: Category | null = null;
      if (categoryName) {
        category = await this.categories.getOrCreateCategory(
          categoryName,
          parentId,
          userInDb,
          queryRunnerManager,
        );

        await this.categories.checkContentDuplicateAndAddCategorySaveLog(
          link,
          category,
          userInDb,
        );
      }

      const newContent = queryRunnerManager.create(Content, {
        link,
        title,
        siteName,
        coverImg,
        description,
        comment,
        deadline,
        ...(category && { category }),
        user,
        ...(favorite && { favorite }),
      });
      await queryRunnerManager.save(newContent);

      return {};
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
      const userInDb = await queryRunnerManager.findOneOrFail(User, {
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
            userInDb?.contents?.filter(
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

      return {};
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

      const content = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];
      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      let category: Category | null = null;
      if (categoryName) {
        category = await this.categories.getOrCreateCategory(
          categoryName,
          parentId,
          userInDb,
          queryRunnerManager,
        );

        await this.categories.checkContentDuplicateAndAddCategorySaveLog(
          link,
          category,
          userInDb,
        );
      }

      await queryRunnerManager.save(Content, [
        { id: content.id, ...newContentObj, ...(category && { category }) },
      ]);

      return {};
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

      const content = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      content.favorite = !content.favorite;
      await queryRunnerManager.save(content);

      return {};
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

      const content = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      content.readFlag = true;

      await this.contents.save(content);

      return {};
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

      const content = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      // delete content
      await queryRunnerManager.delete(Content, content.id);

      return {};
    } catch (e) {
      throw e;
    }
  }

  async getLinkInfo(link: string) {
    let title: string | undefined = '';
    let coverImg: string | undefined = '';
    let description: string | undefined = '';
    let siteName: string | undefined;

    await axios
      .get(link)
      .then((res) => {
        if (res.status !== 200) {
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

      const content: Content | undefined = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      // 문서 요약을 위한 본문 크롤링
      const document: string = await this.summaryService.getDocument(
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
  ) {}

  async addCategory(
    user: User,
    { categoryName, parentId }: AddCategoryBodyDto,
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

      const { categorySlug } = this.categories.generateSlug(categoryName);

      if (parentId) {
        // category depth should be 3
        let currentParentId: number | undefined = parentId;
        let parentCategory: Category | null;
        for (let i = 0; i < 2; i++) {
          parentCategory = await queryRunnerManager.findOne(Category, {
            where: { id: currentParentId },
          });
          if (i == 1 && parentCategory?.parentId != null) {
            throw new ConflictException('Category depth should be 3');
          }
          currentParentId = parentCategory?.parentId;
        }
      }

      // check if category exists in user's categories(check if category name is duplicated in same level too)
      const category = userInDb.categories?.find(
        (category) =>
          category.slug === categorySlug && category.parentId === parentId,
      );

      // if category doesn't exist, create it
      if (category) {
        throw new ConflictException('Category already exists');
      } else {
        // if parent category exists, get parent category
        const parentCategory: Category | null = parentId
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
            parentId: parentCategory?.id,
            user: userInDb,
          }),
        );

        userInDb.categories?.push(category);
        await queryRunnerManager.save(userInDb);
      }

      return {};
    } catch (e) {
      throw e;
    }
  }

  async updateCategory(
    user: User,
    { categoryId, name: categoryName }: UpdateCategoryBodyDto,
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

      const category = userInDb.categories?.find(
        (category) => category.id === categoryId,
      );

      if (category) {
        // Check if user has category with same slug
        const { categorySlug } = this.categories.generateSlug(categoryName);
        if (
          userInDb.categories?.filter(
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
      } else {
        throw new NotFoundException('Category not found.');
      }

      return {};
    } catch (e) {
      throw e;
    }
  }

  async deleteCategory(
    user: User,
    categoryId: number,
    deleteContentFlag: boolean,
    queryRunnerManager: EntityManager,
  ): Promise<DeleteCategoryOutput> {
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

      const category = userInDb.categories?.find(
        (category) => category.id === categoryId,
      );

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      /**
       * 자식 카테고리가 있는 경우, 부모 카테고리와 연결
       */

      // find parent category
      const parentCategory = category.parentId
        ? await queryRunnerManager.findOneOrFail(Category, {
            where: { id: category.parentId },
          })
        : undefined;

      // find children categories
      const childrenCategories = await queryRunnerManager.find(Category, {
        where: { parentId: categoryId },
      });

      // set children categories' parent to parent category
      await queryRunnerManager.save(
        childrenCategories.map((childrenCategory) => {
          childrenCategory.parentId = parentCategory?.id;
          return childrenCategory;
        }),
      );

      /**
       * delete content flag에 따른 분기처리
       */

      // if deleteContentFlag is true, delete all contents in category
      if (deleteContentFlag) {
        await queryRunnerManager.delete(Content, { categoryId });
      }
      // if deleteContentFlag is false, set all contents in category to parent category
      else {
        // find all contents in category with query builder
        const contents = await queryRunnerManager
          .createQueryBuilder(Content, 'content')
          .where('content.categoryId = :categoryId', { categoryId })
          .getMany();

        // set content's category to parent category
        await queryRunnerManager.save(
          contents.map((content) => {
            content.category = parentCategory;
            return content;
          }),
        );
      }

      await queryRunnerManager.delete(Category, { id: categoryId });

      return {};
    } catch (e) {
      throw e;
    }
  }

  async loadPersonalCategories(
    user: User,
  ): Promise<LoadPersonalCategoriesOutput> {
    try {
      const { categories } = await this.users.findOneOrFail({
        where: { id: user.id },
        relations: {
          categories: true,
        },
      });

      if (!categories) {
        throw new NotFoundException('Categories not found.');
      }

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
      // 로그 파일 내의 기록을 불러온다.
      const recentCategoryList: RecentCategoryList[] = this.loadLogs(user.id);

      // 캐시 내의 카테고리 리스트를 최신 순으로 정렬하고, 동시에 저장된 횟수를 추가한다.

      let recentCategoriesWithSaveCount: RecentCategoryListWithSaveCount[] = [];
      const recentCategories: Category[] = [];

      // 3번째 카테고리까지 선정되거나, 더 이상 로그가 없을 때까지 매번 10개의 로그씩 확인한다.
      let remainLogCount = recentCategoryList.length,
        i = 0;
      while (remainLogCount > 0) {
        // 3개의 카테고리가 선정되었으면 루프를 종료한다.
        if (recentCategories.length >= 3) {
          break;
        }

        // 10개의 로그를 확인한다.
        i += 10;
        recentCategoriesWithSaveCount = this.makeCategoryListWithSaveCount(
          recentCategoryList,
          recentCategoriesWithSaveCount,
          i,
        );
        // 10개의 로그를 확인했으므로 남은 로그 수를 10개 감소시킨다.
        remainLogCount -= 10;

        /*
         * 10개의 로그를 확인하고, 만약 이전 호출에서 선정된 카테고리가 이번 호출에서도 선정되는 것을 방지하기위해
         * 이전 호출에서 선정된 카테고리를 제외한 카테고리 리스트를 만든다.
         */
        recentCategoriesWithSaveCount = recentCategoriesWithSaveCount.filter(
          (category) =>
            !recentCategories.find(
              (recentCategory) => recentCategory.id === category.categoryId,
            ),
        );

        // 최근 저장 순
        const orderByDate: number[] = recentCategoriesWithSaveCount.map(
          (category) => category.categoryId,
        );
        // 저장된 횟수 순
        const orderBySaveCount: RecentCategoryListWithSaveCount[] =
          recentCategoriesWithSaveCount.sort(
            (a, b) => b.saveCount - a.saveCount,
          );
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
      }

      return {
        recentCategories,
      };
    } catch (e) {
      throw e;
    }
  }

  /**
   * 파일에서 로그를 불러오는 함수
   * @param id
   * @returns RecentCategoryList[]
   */
  loadLogs(id: number): RecentCategoryList[] {
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
  }

  /**
   * 불러온 로그를 바탕으로 카테고리당 저장된 카운트와 함께 배열을 만드는 함수(매번 10개씩 조회한다.)
   * @param recentCategoryList
   * @param recentCategoriesWithSaveCount
   * @param till
   * @returns
   */
  makeCategoryListWithSaveCount(
    recentCategoryList: RecentCategoryList[],
    recentCategoriesWithSaveCount: RecentCategoryListWithSaveCount[],
    till: number,
  ): RecentCategoryListWithSaveCount[] {
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
  }
}
