import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  AddCategoryBodyDto,
  AddCategoryOutput,
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
  DeleteCategoryOutput,
  RecentCategoryList,
  RecentCategoryListWithSaveCount,
  AutoCategorizeOutput,
  AutoCategorizeBodyDto,
} from './dtos/category.dto';
import {
  LoadPersonalCategoriesOutput,
  LoadFrequentCategoriesOutput,
} from './dtos/load-personal-categories.dto';
import { Category } from './category.entity';
import { Content } from '../contents/entities/content.entity';
import { CategoryRepository } from './category.repository';
import { ContentRepository } from '../contents/repository/content.repository';
import { getLinkContent, getLinkInfo } from '../contents/util/content.util';
import { OpenaiService } from '../openai/openai.service';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/repository/user.repository';
import {
  generateCategoriesTree,
  generateSlug,
  loadLogs,
  makeCategoryListWithSaveCount,
} from './utils/category.util';
import { Transactional } from '../common/aop/transactional';

@Injectable()
export class CategoryService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly userRepository: UserRepository,
    private readonly openaiService: OpenaiService,
  ) {}

  @Transactional()
  async addCategory(
    user: User,
    { categoryName, iconName, parentId }: AddCategoryBodyDto,
    entityManager?: EntityManager,
  ): Promise<AddCategoryOutput> {
    try {
      const userInDb = await this.userRepository.findOneWithCategories(user.id);

      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const { categorySlug } = generateSlug(categoryName);

      if (parentId) {
        // category depth should be 3
        let currentParentId: number | undefined = parentId;
        let parentCategory: Category | null;
        for (let i = 0; i < 2; i++) {
          parentCategory = await this.categoryRepository.findById(
            currentParentId,
            entityManager,
          );
          if (i == 1 && parentCategory?.parentId !== null) {
            throw new ConflictException('Category depth should be 3');
          }
          if (parentCategory?.parentId)
            currentParentId = parentCategory?.parentId;
          else break;
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
          ? await this.categoryRepository.findById(parentId)
          : null;
        // if parent category doesn't exist, throw error
        if (!parentCategory && parentId) {
          throw new NotFoundException('Parent category not found');
        }

        const category = await this.categoryRepository.save({
          slug: categorySlug,
          name: categoryName,
          iconName,
          parentId: parentCategory?.id,
          user: userInDb,
        });

        userInDb.categories?.push(category);
        await entityManager!.save(userInDb);
      }

      return {};
    } catch (e) {
      throw e;
    }
  }

  async updateCategory(
    user: User,
    {
      categoryId,
      name: categoryName,
      iconName,
      parentId,
    }: UpdateCategoryBodyDto,
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
          const { categorySlug } = generateSlug(categoryName);
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

        if (iconName) {
          category.iconName = iconName;
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
        } else {
          // 유저 당 대 카테고리 10개 제한
          const isOverCategoryLimit =
            await this.categoryRepository.isOverCategoryLimit(user);

          if (isOverCategoryLimit) {
            throw new ConflictException(
              "Root categories can't be more than 10 in one user",
            );
          }

          category.parentId = null;
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
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      /**
       * 자식 카테고리가 있는 경우, 부모 카테고리와 연결
       * 단, 삭제되는 카테고리가 1단 카테고리인 경우 부모 카테고리가 없으므로
       * 자식 카테고리의 부모 카테고리를 null로 설정
       */

      // find parent category
      const parentCategory = category.parentId
        ? await queryRunnerManager.findOneOrFail(Category, {
            where: { id: category.parentId },
          })
        : null;

      // find children categories
      const childrenCategories = await queryRunnerManager.find(Category, {
        where: { parentId: categoryId },
        order: { createdAt: 'DESC' },
      });

      await queryRunnerManager.save(
        childrenCategories.map((childrenCategory) => {
          childrenCategory.parentId = parentCategory?.id ?? null;
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
      const categories = await this.categoryRepository.findWithContents(
        user.id,
      );

      if (!categories) {
        throw new NotFoundException('Categories not found.');
      }

      // make categories tree by parentid
      const categoriesTree = generateCategoriesTree(categories);

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
      const recentCategoryList: RecentCategoryList[] = loadLogs(user.id);

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
        recentCategoriesWithSaveCount = makeCategoryListWithSaveCount(
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
      const { title, siteName, description } = await getLinkInfo(link);

      const content = await getLinkContent(link);

      const questionLines = [
        "You are a machine tasked with auto-categorizing articles based on information obtained through web scraping. You can only answer a single category name. Here is the article's information:",
      ];

      if (title) {
        questionLines.push(
          `The article in question is titled "${title.trim()}"`,
        );
      }

      if (content) {
        const contentLength = content.length / 2;
        questionLines.push(
          `The 150 characters of the article is, "${content
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
        `Please provide the most suitable category among the following. Here is Category options: [${categories.join(
          ', ',
        )}, None]`,
      );

      // Join all lines together into a single string
      const question = questionLines.join(' ');
      console.log(question);

      const response = await this.openaiService.createChatCompletion({
        question,
        temperature: 0,
      });

      return { category: response.choices[0].message?.content || 'None' };
    } catch (e) {
      throw e;
    }
  }

  async autoCategorizeWithId(user: User, link: string) {
    const _categories = await this.categoryRepository.findByUserId(user.id);
    if (_categories.length === 0) {
      throw new NotFoundException('Categories not found');
    }

    const categories = _categories.map((category) => ({
      ...category,
      depth: 0,
    }));

    categories.map((category, index) => {
      categories.slice(index + 1).map((subCategory) => {
        if (subCategory.parentId && subCategory.parentId === category.id) {
          subCategory.depth = category.depth + 1;
        }
      });
    });

    const { title, siteName, description } = await getLinkInfo(encodeURI(link));

    const content = await getLinkContent(link);

    const question = `You are a machine tasked with auto-categorizing articles based on information obtained through web scraping.

You can only answer a single category name. Here is the article's information:
<title>${title && `title: "${title.trim()}"`}</title>
<content>${
      content && `content: "${content.replace(/\s/g, '').slice(0, 300).trim()}"`
    }</content>
<description>${
      description && `description: "${description.trim()}"`
    }</description>
<siteName>${siteName && `site name: "${siteName.trim()}"`}</siteName>

Given the categories below, please provide suitable category for the article following the rules.
[RULES]
- The deeper the category depth, the more specific the category is.
- If the 1, 2, and 3 depth categories are equally worthy of saving links, then the deeper categories should be recommended more.
- If there's no suitable category, must provide reply with "None".
<categories>${categories
      .map((category) =>
        JSON.stringify({
          id: category.id,
          name: category.name,
          depth: category.depth,
        }),
      )
      .join('\n')}</categories>
  

Present your reply options in JSON format below.
\`\`\`json
{
  "id": id,
  "name": "category name"
}
\`\`\`
        `;

    try {
      const response = await this.openaiService.createChatCompletion({
        model: 'o1-mini',
        question,
        temperature: 0,
        responseType: 'json',
      });

      const categoryStr = response.choices[0].message?.content;

      if (categoryStr) {
        const { id, name } = JSON.parse(
          categoryStr.replace(/^```json|```$/g, '').trim(),
        );
        return { category: { id, name } };
      }

      throw new InternalServerErrorException('Failed to categorize');
    } catch (e) {
      throw e;
    }
  }

  async autoCategorizeForTest(
    autoCategorizeBody: AutoCategorizeBodyDto,
  ): Promise<AutoCategorizeOutput> {
    try {
      const { link, categories } = autoCategorizeBody;
      const { title, siteName, description } = await getLinkInfo(link);

      /**
       * TODO: 본문 크롤링 개선 필요
       * 현재 p 태그만 크롤링하는데, 불필요한 내용이 포함되는 경우가 많음
       * 그러나 하나하나 예외 처리하는 방법을 제외하곤 방법을 못 찾은 상황
       */
      const content = await getLinkContent(link);

      const questionLines = [
        "You are a machine tasked with auto-categorizing articles based on information obtained through web scraping. You can only answer a single category name. Here is the article's information:",
      ];

      if (title) {
        questionLines.push(
          `The article in question is titled "${title.trim()}"`,
        );
      }

      if (content) {
        const contentLength = content.length / 2;
        questionLines.push(
          `The 150 characters of the article is, "${content
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
        `Please provide the most suitable category among the following. Here is Category options: [${categories.join(
          ', ',
        )}, None]`,
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
