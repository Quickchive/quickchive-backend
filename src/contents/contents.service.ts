import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import { AddContentBodyDto, AddContentOutput } from './dtos/content.dto';
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      if (!link) {
        throw new Error('Missing required field.');
      }
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          contents: true,
          categories: true,
        },
      });

      const category = categoryName
        ? await this.getOrCreateCategory(categoryName, queryRunnerManager)
        : null;

      const newContent = queryRunnerManager.create(Content, {
        link,
        title,
        description,
        comment,
        category,
      });
      newContent.user = userInDb;
      await queryRunnerManager.save(newContent);
      userInDb.categories.push(category);
      queryRunnerManager.save(userInDb);

      await queryRunner.commitTransaction();

      return {
        ok: true,
      };
    } catch {
      await queryRunner.rollbackTransaction();

      return {
        ok: false,
        error: 'Could not add Content',
      };
    }
  }
}
