import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Content } from 'src/contents/entities/content.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager, In, Not, QueryRunner } from 'typeorm';
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
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      // Check if content already exists
      if (
        userInDb.collections.filter(
          (collection) => collection.title === title,
        )[0]
      ) {
        throw new HttpException(
          'Collection with that title already exists.',
          409,
        );
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

      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
      throw new HttpException(e.message, e.statusCode);
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
