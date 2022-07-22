import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import {
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
} from './dtos/category.dto';
import {
  AddContentBodyDto,
  AddContentOutput,
  UpdateContentBodyDto,
} from './dtos/content.dto';
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';

@Injectable()
export class ContentsService {
  constructor(private readonly dataSource: DataSource) {}

  async getOrCreateCategory(
    name: string,
    queryRunnerManager: EntityManager,
  ): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await queryRunnerManager.findOneBy(Category, {
      slug: categorySlug,
    });

    if (!category) {
      category = await queryRunnerManager.save(
        queryRunnerManager.create(Category, {
          slug: categorySlug,
          name: categoryName,
        }),
      );
    }

    return category;
  }

  async addContent(
    user: User,
    { link, title, description, comment, categoryName }: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    const queryRunner = await this.init();
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: true,
          categories: true,
        },
      });

      // Get or create category
      const category = categoryName
        ? await this.getOrCreateCategory(categoryName, queryRunnerManager)
        : null;

      // Check if content already exists
      if (userInDb.contents.filter((content) => content.link === link)[0]) {
        throw new Error('Content already exists.');
      }

      const newContent = queryRunnerManager.create(Content, {
        link,
        title,
        description,
        comment,
        category,
      });
      await queryRunnerManager.save(newContent);
      userInDb.contents.push(newContent);
      userInDb.categories.push(category);
      queryRunnerManager.save(userInDb);

      await queryRunner.commitTransaction();

      return {
        ok: true,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();

      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async updateContent(
    user: User,
    updateContentBody: UpdateContentBodyDto,
  ): Promise<AddContentOutput> {
    const queryRunner = await this.init();
    const queryRunnerManager: EntityManager = await queryRunner.manager;

    const { link, title, description, comment, categoryName } =
      updateContentBody;
    const newContentObj = { link, title, description, comment };
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

      const content = userInDb.contents.filter(
        (content) => content.link === link,
      )[0];

      if (!content) {
        throw new Error('Content not found.');
      }

      // update content
      let category: Category = null;
      if (categoryName) {
        category = await this.getOrCreateCategory(
          categoryName,
          queryRunnerManager,
        );
        userInDb.categories.push(category);
        const userCurrentCategories = userInDb.categories.filter(
          (category) => category.name === content.category.name,
        );
        if (userCurrentCategories.length === 1) {
          userInDb.categories = userInDb.categories.filter(
            (category) => category.name !== content.category.name,
          );
        }
        queryRunnerManager.save(userInDb);
      }

      queryRunnerManager.save(Content, [
        { id: content.id, ...newContentObj, ...(category && { category }) },
      ]);

      await queryRunner.commitTransaction();

      return {
        ok: true,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();

      return {
        ok: false,
        error: e.message,
      };
    }
  }

  //initalize the database
  async init(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return queryRunner;
  }
}

@Injectable()
export class CategoryService {
  constructor(private readonly dataSource: DataSource) {}

  async getOrCreateCategory(
    name: string,
    queryRunnerManager: EntityManager,
  ): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await queryRunnerManager.findOneBy(Category, {
      slug: categorySlug,
    });

    if (!category) {
      category = await queryRunnerManager.save(
        queryRunnerManager.create(Category, {
          slug: categorySlug,
          name: categoryName,
        }),
      );
    }

    return category;
  }

  async updateCategory(
    user: User,
    { originalName, name }: UpdateCategoryBodyDto,
  ): Promise<UpdateCategoryOutput> {
    const queryRunner = await this.init();
    const queryRunnerManager: EntityManager = await queryRunner.manager;
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
        throw new Error('User not found.');
      }

      // Get or create category
      const category = await this.getOrCreateCategory(name, queryRunnerManager);

      // Check if user has category
      if (
        !userInDb.categories.filter(
          (category) => category.name === originalName,
        )[0]
      ) {
        throw new Error("Category doesn't exists in current user.");
      }
      // Update and delete previous category
      userInDb.categories.push(category);
      userInDb.contents.forEach((content) => {
        if (content.category && content.category.name === originalName) {
          content.category = category;
          queryRunnerManager.save(content);
        }
      });
      userInDb.categories = userInDb.categories.filter(
        (category) => category.name !== originalName,
      );
      queryRunnerManager.save(userInDb);

      await queryRunner.commitTransaction();

      return {
        ok: true,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();

      return {
        ok: false,
        error: e.message,
      };
    }
  }

  //initalize the database
  async init(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return queryRunner;
  }
}
