import { Injectable } from '@nestjs/common';
import { Content } from 'src/contents/entities/content.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager, In, QueryRunner } from 'typeorm';
import {
  AddCollectionBodyDto,
  AddCollectionOutput,
} from './dtos/collection.dto';
import { Collection } from './entities/collection.entity';

@Injectable()
export class CollectionsService {
  constructor(private readonly dataSource: DataSource) {}

  async addCollection(
    user: User,
    { title, comment, contentIdList }: AddCollectionBodyDto,
  ): Promise<AddCollectionOutput> {
    const queryRunner = await this.init();
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          collections: true,
        },
      });

      // Check if content already exists
      if (
        userInDb.collections.filter(
          (collection) => collection.title === title,
        )[0]
      ) {
        throw new Error('Collection with that title already exists.');
      }

      let contents: Content[] = [];

      // Load contents if contentIdList is not empty
      if (contentIdList) {
        contents = await queryRunnerManager.find(Content, {
          where: { id: In(contentIdList) },
        });
      }

      // Create collection order
      const order: number[] = [...contents.map((content) => content.id)];

      // Create collection
      const newCollection = queryRunnerManager.create(Collection, {
        title,
        comment,
        contents,
        order,
        user,
      });
      await queryRunnerManager.save(newCollection);
      // userInDb.contents.push(newContent);
      // userInDb.categories.push(category);
      // queryRunnerManager.save(userInDb);

      await queryRunner.commitTransaction();

      return {
        ok: true,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
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
