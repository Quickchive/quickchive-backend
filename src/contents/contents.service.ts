import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SummaryService } from 'src/summary/summary.service';
import { User } from 'src/users/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  AddCategoryBodyDto,
  AddCategoryOutput,
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
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';
import { CategoryRepository } from './repository/category.repository';
import * as cheerio from 'cheerio';
import axios from 'axios';

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

      // generate category name and slug
      const { categoryName: refinedCategoryName, categorySlug } =
        this.categories.generateNameAndSlug(categoryName);

      // check if category exists in user's categories
      // TODO : 대 카테고리를 기준으로 중복 체크해야함.
      let category: Category = userInDb.categories.find(
        (category) => category.slug === categorySlug,
      );

      // if category doesn't exist, create it
      if (!category) {
        category = await queryRunnerManager.save(
          queryRunnerManager.create(Category, {
            slug: categorySlug,
            name: refinedCategoryName,
            user: userInDb,
          }),
        );

        userInDb.categories.push(category);
        await queryRunnerManager.save(userInDb);
      }

      // // Get or create category
      // const category = categoryName
      //   ? await this.categories.checkAndCreate(categoryName, queryRunnerManager)
      //   : null;

      // // Check if content already exists in same category
      // if (
      //   userInDb.contents.filter(
      //     (content) =>
      //       content.link === link && content.category?.name === category?.name,
      //   )[0]
      // ) {
      //   throw new ConflictException(
      //     'Content with that link already exists in same category.',
      //   );
      // }

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
      userInDb.contents.push(newContent);
      categoryName ? userInDb.categories.push(category) : null;
      await queryRunnerManager.save(userInDb);

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
          });
          await queryRunnerManager.save(newContent);
          userInDb.contents.push(newContent);
        }
        await queryRunnerManager.save(userInDb);
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

      // generate category name and slug
      const { categoryName: refinedCategoryName, categorySlug } =
        this.categories.generateNameAndSlug(categoryName);

      // check if category exists in user's categories
      // TODO : 대 카테고리를 기준으로 중복 체크해야함.
      let category: Category = userInDb.categories.find(
        (category) => category.slug === categorySlug,
      );

      // if category doesn't exist, create it
      if (!category) {
        category = await queryRunnerManager.save(
          queryRunnerManager.create(Category, {
            slug: categorySlug,
            name: refinedCategoryName,
            user: userInDb,
          }),
        );

        userInDb.categories.push(category);
        await queryRunnerManager.save(userInDb);
      }
      const contentThatSameLinkAndCategory = userInDb.contents.find(
        (contentInFilter) =>
          contentInFilter.link === content.link &&
          contentInFilter.id !== contentId &&
          contentInFilter?.category?.slug === categorySlug,
      );
      if (contentThatSameLinkAndCategory) {
        throw new ConflictException(
          'Content with that link already exists in same category.',
        );
      }

      // // update content
      // let category: Category = null;
      // if (categoryName) {
      //   category = await this.categories.checkAndCreate(
      //     categoryName,
      //     queryRunnerManager,
      //   );
      //   if (!userInDb.categories.includes(category)) {
      //     userInDb.categories.push(category);
      //     await queryRunnerManager.save(userInDb);
      //   }
      // }

      queryRunnerManager.save(Content, [
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

      // // Check if a category exists and create a new one or throw a duplicate error
      // await this.categories.checkAndCreate(
      //   userInDb,
      //   categoryName,
      //   queryRunnerManager,
      // );

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
        // if parent category exists, get its id
        let parentCategory: Category;
        if (parentId) {
          parentCategory = await queryRunnerManager.findOne(Category, {
            where: { id: parentId },
          });
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

      // // Check if a category exists and create a new one or throw a duplicate error
      // const category = await this.categories.checkAndCreate(
      //   userInDb,
      //   name,
      //   queryRunnerManager,
      // );

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
      // Check if user has category with same name
      // if (userInDb.categories.filter((category) => category.name === name)[0]) {
      //   throw new ConflictException(
      //     'Category with that name already exists in current user.',
      //   );
      // }
      // Update and delete previous category
      // userInDb.categories.push(category);
      // userInDb.contents.forEach(async (content) => {
      //   if (content.category && content.category.name === originalName) {
      //     content.category = category;
      //     await queryRunnerManager.save(content);
      //   }
      // });
      // userInDb.categories = userInDb.categories.filter(
      //   (category) => category.name !== originalName,
      // );
      // await queryRunnerManager.save(userInDb);

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
      // const userInDb = await queryRunnerManager.findOne(User, {
      //   where: { id: user.id },
      //   relations: {
      //     contents: {
      //       category: true,
      //     },
      //     categories: true,
      //   },
      // });
      // if (!userInDb) {
      //   throw new NotFoundException('User not found');
      // }

      // const category = userInDb.categories.filter(
      //   (category) => category.id === categoryId,
      // )[0];

      // if (!category) {
      //   throw new NotFoundException('Category not found.');
      // }

      // userInDb.categories = userInDb.categories.filter(
      //   (category) => category.id !== categoryId,
      // );
      // userInDb.contents.forEach(async (content) => {
      //   if (content.category && content.category.id === categoryId) {
      //     content.category = null;
      //     await queryRunnerManager.save(content);
      //   }
      // });
      // await queryRunnerManager.save(userInDb);

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
}
