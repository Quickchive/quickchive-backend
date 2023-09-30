import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import {
  AddCategoryBodyDto,
  AddCategoryOutput,
  RecentCategoryList,
  DeleteCategoryOutput,
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
  RecentCategoryListWithSaveCount,
  AutoCategorizeBodyDto,
  AutoCategorizeOutput,
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
  LoadFrequentCategoriesOutput,
  LoadPersonalCategoriesOutput,
} from './dtos/load-personal-categories.dto';
import {
  LoadFavoritesOutput,
  LoadPersonalContentsOutput,
} from './dtos/load-personal-contents.dto';
import { SummaryService } from '../summary/summary.service';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';
import { LoadReminderCountOutput } from './dtos/load-personal-remider-count.dto';
import { UserRepository } from '../users/repository/user.repository';
import { ContentRepository } from './repository/content.repository';
import { CategoryUtil } from './util/category.util';
import { CategoryRepository } from './repository/category.repository';
import { ContentUtil } from './util/content.util';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class ContentsService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly contentRepository: ContentRepository,
    private readonly summaryService: SummaryService,
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryUtil: CategoryUtil,
    private readonly contentUtil: ContentUtil,
  ) {}

  async addContent(
    user: User,
    {
      link,
      title,
      comment,
      reminder,
      favorite,
      categoryName,
      parentId,
    }: AddContentBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    try {
      const userInDb =
        await this.userRepository.findOneWithContentsAndCategories(user.id);
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      // get og tag info from link
      const {
        title: linkTitle,
        siteName,
        description,
        coverImg,
      } = await this.contentUtil.getLinkInfo(link);
      title = title ? title : linkTitle;

      let category: Category | null = null;
      if (categoryName) {
        category = await this.categoryRepository.getOrCreateCategory(
          categoryName,
          parentId,
          userInDb,
          queryRunnerManager,
        );

        await this.categoryUtil.checkContentDuplicateAndAddCategorySaveLog(
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
        reminder,
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
    { contentLinks, categoryName, parentId }: AddMultipleContentsBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    try {
      const userInDb =
        await this.userRepository.findOneWithContentsAndCategories(user.id);

      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      if (contentLinks.length > 0) {
        let category: Category | null = null;
        if (categoryName) {
          category = await this.categoryRepository.getOrCreateCategory(
            categoryName,
            parentId,
            userInDb,
            queryRunnerManager,
          );
        }
        for (const link of contentLinks) {
          const { title, description, coverImg, siteName } =
            await this.contentUtil.getLinkInfo(link);

          if (category) {
            await this.categoryUtil.checkContentDuplicateAndAddCategorySaveLog(
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
            ...(category && { category }),
            description,
            user: userInDb,
          });
          await queryRunnerManager.save(newContent);

          // 각 링크마다 처리 후 transaction commit
          await queryRunnerManager.query('COMMIT');
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
      reminder,
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
      reminder,
      favorite,
    };
    try {
      const userInDb =
        await this.userRepository.findOneWithContentsAndCategories(user.id);
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
        category = await this.categoryRepository.getOrCreateCategory(
          categoryName,
          parentId,
          userInDb,
          queryRunnerManager,
        );

        await this.categoryUtil.checkContentDuplicateAndAddCategorySaveLog(
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
      const userInDb = await this.userRepository.findOneWithContents(user.id);

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

  async deleteContent(
    user: User,
    contentId: number,
    queryRunnerManager: EntityManager,
  ): Promise<DeleteContentOutput> {
    try {
      const content = await this.contentRepository.findOneBy({ id: contentId });

      if (!content) {
        throw new NotFoundException('Content not found.');
      }
      if (content.userId !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to delete this content',
        );
      }

      // delete content
      await queryRunnerManager.delete(Content, content.id);

      return {};
    } catch (e) {
      throw e;
    }
  }

  async loadPersonalContents(
    user: User,
    categoryId: number | undefined,
  ): Promise<LoadPersonalContentsOutput> {
    try {
      let contents = await this.contentRepository.findWithCategories(user.id);

      if (categoryId && contents) {
        contents = contents.filter(
          (content) => content?.category?.id === categoryId,
        );
      }

      return {
        contents,
      };
    } catch (e) {
      throw e;
    }
  }

  async loadFavorites(user: User): Promise<LoadFavoritesOutput> {
    try {
      const favoriteContents =
        await this.contentRepository.findWhereFavoriteWithCategories(user.id);

      return {
        favorite_contents: favoriteContents,
      };
    } catch (e) {
      throw e;
    }
  }

  async loadReminderCount(user: User): Promise<LoadReminderCountOutput> {
    try {
      // get reminder not null
      const reminderCountThatIsNotNull =
        await this.contentRepository.GetCountWhereReminderIsNotNull(user.id);

      // get reminder is past
      const reminderCountThatIsPast =
        await this.contentRepository.GetCountWhereReminderIsPast(user.id);

      // minus reminderCountThatIsPast from reminderCount
      const reminderCount =
        reminderCountThatIsNotNull - reminderCountThatIsPast;

      return {
        count: reminderCount,
      };
    } catch (e) {
      throw e;
    }
  }

  async summarizeContent(
    user: User,
    contentId: number,
  ): Promise<SummarizeContentOutput> {
    try {
      const userInDb = await this.userRepository.findOneWithContents(user.id);
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
    private readonly contentRepository: ContentRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryUtil: CategoryUtil,
    private readonly userRepository: UserRepository,
    private readonly contentUtil: ContentUtil,
    private readonly openaiService: OpenaiService,
  ) {}

  async addCategory(
    user: User,
    { categoryName, parentId }: AddCategoryBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<AddCategoryOutput> {
    try {
      const userInDb = await this.userRepository.findOneWithCategories(user.id);

      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const { categorySlug } = this.categoryUtil.generateSlug(categoryName);

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
      } else {
        /**
         * TODO: 유료 플랜 사용자이면 카테고리 개수 제한 없도록 추가 구성해야함.
         */
        // if parentId is null, it means that category is root category
        // root categories can't be more than 10 in one user
        const isOverCategoryLimit =
          await this.categoryRepository.isOverCategoryLimit(user);
        if (isOverCategoryLimit) {
          throw new ConflictException(
            "Root categories can't be more than 10 in one user",
          );
        }
      }

      // check if category exists in user's categories(check if category name is duplicated in same level too)
      const category = userInDb.categories?.find(
        (category) =>
          category.slug === categorySlug &&
          (category.parentId === parentId || (!parentId && !category.parentId)),
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
    { categoryId, name: categoryName, parentId }: UpdateCategoryBodyDto,
    queryRunnerManager: EntityManager,
  ): Promise<UpdateCategoryOutput> {
    try {
      const userInDb =
        await this.userRepository.findOneWithContentsAndCategories(user.id);

      // Check if user exists
      if (!userInDb) {
        throw new NotFoundException('User not found.');
      }

      const category = userInDb.categories?.find(
        (category) => category.id === categoryId,
      );

      if (category) {
        // Check if user has category with same slug
        if (categoryName) {
          const { categorySlug } = this.categoryUtil.generateSlug(categoryName);
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
        }

        if (parentId) {
          // category depth should be 3
          let parentCategory = await this.categoryRepository.findOne({
            where: { id: parentId },
          });
          if (!parentCategory) {
            throw new NotFoundException('Parent category not found.');
          } else if (parentCategory?.parentId !== null) {
            parentCategory = await this.categoryRepository.findOne({
              where: { id: parentCategory.parentId },
            });
            if (parentCategory?.parentId !== null) {
              throw new ConflictException('Category depth should be 3');
            }
          }

          category.parentId = parentId;
        }

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
      const userInDb =
        await this.userRepository.findOneWithContentsAndCategories(user.id);

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
        await queryRunnerManager.delete(Content, { category });
      }

      // if deleteContentFlag is false, set all contents in category to parent category
      else {
        // find all contents in category with query builder
        const contents = await this.contentRepository.findByCategoryId(
          categoryId,
        );

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
      const { categories } =
        await this.userRepository.findOneWithCategoriesOrFail(user.id);

      if (!categories) {
        throw new NotFoundException('Categories not found.');
      }

      // make categories tree by parentid
      const categoriesTree =
        this.categoryUtil.generateCategoriesTree(categories);

      return {
        categoriesTree,
      };
    } catch (e) {
      throw e;
    }
  }

  async loadFrequentCategories(
    user: User,
  ): Promise<LoadFrequentCategoriesOutput> {
    try {
      // 로그 파일 내의 기록을 불러온다.
      const recentCategoryList: RecentCategoryList[] =
        this.categoryUtil.loadLogs(user.id);

      // 캐시 내의 카테고리 리스트를 최신 순으로 정렬하고, 동시에 저장된 횟수를 추가한다.

      let recentCategoriesWithSaveCount: RecentCategoryListWithSaveCount[] = [];
      const frequentCategories: Category[] = [];

      // 3번째 카테고리까지 선정되거나, 더 이상 로그가 없을 때까지 매번 10개의 로그씩 확인한다.
      let remainLogCount = recentCategoryList.length,
        i = 0;
      while (remainLogCount > 0) {
        // 3개의 카테고리가 선정되었으면 루프를 종료한다.
        if (frequentCategories.length >= 3) {
          break;
        }

        // 10개의 로그를 확인한다.
        i += 10;
        recentCategoriesWithSaveCount =
          this.categoryUtil.makeCategoryListWithSaveCount(
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
            !frequentCategories.find(
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
            const category = await this.categoryRepository.findOne({
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
              frequentCategories.push(category);
            }
          }
        }

        /*
         * 나머지 3-n 개 선정 기준
         * 1. 최근 저장 순
         */
        const N = 3 - frequentCategories.length;
        for (let i = 0; i < N; i++) {
          if (i < orderByDate.length) {
            const category = await this.categoryRepository.findOne({
              where: { id: orderByDate[i] },
            });

            if (category) {
              frequentCategories.push(category);
            }
          }
        }
      }

      return {
        frequentCategories,
      };
    } catch (e) {
      throw e;
    }
  }

  async autoCategorize(
    user: User,
    link: string,
  ): Promise<AutoCategorizeOutput> {
    try {
      const userInDb = await this.userRepository.findOneWithCategories(user.id);
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      if (!userInDb.categories) {
        throw new NotFoundException('Categories not found');
      }
      const categories: string[] = [];
      userInDb.categories.forEach((category) => {
        if (!category.parentId) {
          categories.push(category.name);
        }
      });
      const { title, siteName, description } =
        await this.contentUtil.getLinkInfo(link);

      const content = await this.contentUtil.getLinkContent(link);

      let questionLines = [
        "You are now auto categorizing machine. You can only answer a single category name or None. Here is the article's information:",
      ];

      if (title) {
        questionLines.push(`The title is "${title.trim()}"`);
      }

      if (content) {
        const contentLength = content.length / 2;
        questionLines.push(
          `The opening 150 characters of the article read, "${content
            .replace(/\s/g, '')
            .slice(contentLength - 150, contentLength + 150)
            .trim()}"`,
        );
      }

      if (description) {
        questionLines.push(`The description is ${description.trim()}"`);
      }

      if (siteName) {
        questionLines.push(`The site's name is "${siteName.trim()}"`);
      }

      // Add the category options to the end of the list
      questionLines.push(
        `Please tell me the most appropriate category among the following. If none are suitable, return None. Here is Category options: [${categories.join(
          ', ',
        )}]`,
      );

      // Join all lines together into a single string
      const question = questionLines.join(' ');

      const response = await this.openaiService.createChatCompletion({
        question,
      });

      return { category: response.choices[0].message?.content || 'None' };
    } catch (e) {
      throw e;
    }
  }

  async autoCategorizeForTest(
    autoCategorizeBody: AutoCategorizeBodyDto,
  ): Promise<AutoCategorizeOutput> {
    try {
      const { link, categories } = autoCategorizeBody;
      const { title, siteName, description } =
        await this.contentUtil.getLinkInfo(link);

      /**
       * TODO: 본문 크롤링 개선 필요
       * 현재 p 태그만 크롤링하는데, 불필요한 내용이 포함되는 경우가 많음
       * 그러나 하나하나 예외 처리하는 방법을 제외하곤 방법을 못 찾은 상황
       */
      const content = await this.contentUtil.getLinkContent(link);

      let questionLines = [
        "You are now auto categorizing machine. You can only answer a single category name or None. Here is the article's information:",
      ];

      if (title) {
        questionLines.push(`The title is "${title.trim()}"`);
      }

      if (content) {
        const contentLength = content.length / 2;
        questionLines.push(
          `The opening 150 characters of the article read, "${content
            .replace(/\s/g, '')
            .slice(contentLength - 150, contentLength + 150)
            .trim()}"`,
        );
      }

      if (description) {
        questionLines.push(`The description is ${description.trim()}"`);
      }

      if (siteName) {
        questionLines.push(`The site's name is "${siteName.trim()}"`);
      }

      // Add the category options to the end of the list
      questionLines.push(
        `Please tell me the most appropriate category among the following. If none are suitable, return None. Here is Category options: [${categories.join(
          ', ',
        )}]`,
      );

      // Join all lines together into a single string
      const question = questionLines.join(' ');

      const response = await this.openaiService.createChatCompletion({
        question,
      });

      return { category: response.choices[0].message?.content || 'None' };
    } catch (e) {
      throw e;
    }
  }
}
