import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Content } from 'src/contents/entities/content.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager, In, Not, QueryRunner } from 'typeorm';
import {
  AddCollectionBodyDto,
  AddCollectionOutput,
  UpdateCollectionBodyDto,
  UpdateCollectionOutput,
} from './dtos/collection.dto';
import { Collection } from './entities/collection.entity';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { NestedContent } from './entities/nested-content.entity';
import {
  AddNestedContentBodyDto,
  AddNestedContentOutput,
  AddNestedContentToCollectionBodyDto,
  AddNestedContentToCollectionOutput,
} from './dtos/nested-content.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly dataSource: DataSource) {}

  async addCollection(
    user: User,
    { title, comment, contentLinkList }: AddCollectionBodyDto,
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

      // Create collection order array
      let nestedContentList: NestedContent[] = [];

      console.log(contentLinkList);
      // Load contents if contentLinkList is not empty
      if (contentLinkList) {
        for (const contentLink of contentLinkList) {
          const { nestedContent } = await this.addNestedContent({
            link: contentLink,
          });
          nestedContentList.push(nestedContent);
        }
      }

      // Create collection order
      const order: number[] = [
        ...nestedContentList.map((content) => content.id),
      ];

      // Create collection
      const newCollection = queryRunnerManager.create(Collection, {
        title,
        comment,
        contents: nestedContentList,
        order,
        user,
      });
      await queryRunnerManager.save(newCollection);

      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
      throw new HttpException(e.message, e.status);
    }
  }

  async updateCollection(
    user: User,
    { id, title, comment }: UpdateCollectionBodyDto,
  ): Promise<UpdateCollectionOutput> {
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

      // Check if content exists
      const collectionInDb: Collection = userInDb.collections.filter(
        (collection) => collection.id === id,
      )[0];
      if (!collectionInDb) {
        throw new NotFoundException('Collection not found.');
      }

      // Update title and comment if they are not empty
      title ? (collectionInDb.title = title) : null;
      comment ? (collectionInDb.comment = comment) : null;

      // Update collection to database
      const updatedCollection = queryRunnerManager.save(Collection, {
        title,
        comment,
        user,
      });
      await queryRunnerManager.save(updatedCollection);
      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
      throw new HttpException(e.message, e.status);
    }
  }

  async addNestedContentToCollection(
    user: User,
    {
      collectionId,
      link,
      title,
      description,
      comment,
    }: AddNestedContentToCollectionBodyDto,
  ): Promise<AddNestedContentToCollectionOutput> {
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

      // Check if content exists
      const collectionInDb: Collection = userInDb.collections.filter(
        (collection) => collection.id === collectionId,
      )[0];
      if (!collectionInDb) {
        throw new NotFoundException('Collection not found.');
      }

      // Create collection order array
      let nestedContentList: NestedContent[] = collectionInDb.contents;

      // Create new nested content and add to collection order array
      const { nestedContent } = await this.addNestedContent({
        link,
        title,
        description,
        comment,
      });
      nestedContentList.push(nestedContent);
      collectionInDb.order.push(nestedContent.id);

      // Update collection to database
      await queryRunnerManager.save(collectionInDb);
      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
      throw new HttpException(e.message, e.status);
    }
  }

  // Add nested content to the database
  async addNestedContent({
    link,
    title,
    description,
    comment,
  }: AddNestedContentBodyDto): Promise<AddNestedContentOutput> {
    const queryRunner = await this.init();
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      // get og tag info from link
      let coverImg: string = '';
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
              });
            }
          }
        })
        .catch((e) => {
          console.log(e.message);
          // Control unreachable link
          title = link.split('/').at(-1);
        });

      const newNestedContent = queryRunnerManager.create(NestedContent, {
        link,
        title,
        coverImg,
        description,
        comment,
      });
      await queryRunnerManager.save(newNestedContent);

      await queryRunner.commitTransaction();

      return { nestedContent: newNestedContent };
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new HttpException(e.message, e.status);
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
