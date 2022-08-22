import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import {
  AddCollectionBodyDto,
  AddCollectionOutput,
  DeleteCollectionOutput,
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
} from './dtos/nested-content.dto';
import { Category } from 'src/contents/entities/category.entity';
import { getOrCreateCategory, init } from 'src/utils';

@Injectable()
export class CollectionsService {
  constructor(private readonly dataSource: DataSource) {}

  async addCollection(
    user: User,
    { title, comment, contentLinkList, categoryName }: AddCollectionBodyDto,
  ): Promise<AddCollectionOutput> {
    const queryRunner = await init(this.dataSource);
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          collections: true,
          categories: true,
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

      // Get or create category
      const category = categoryName
        ? await getOrCreateCategory(categoryName, queryRunnerManager)
        : null;

      // Create collection
      const newCollection = queryRunnerManager.create(Collection, {
        title,
        comment,
        contents: nestedContentList,
        order,
        user,
        category,
      });
      await queryRunnerManager.save(newCollection);

      // Add collection to user
      userInDb.collections.push(newCollection);
      categoryName ? userInDb.categories.push(category) : null;
      await queryRunnerManager.save(userInDb);

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
    {
      collectionId,
      title,
      comment,
      categoryName,
      contentLinkList,
    }: UpdateCollectionBodyDto,
  ): Promise<UpdateCollectionOutput> {
    const queryRunner = await init(this.dataSource);
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      const userInDb = await queryRunnerManager.findOne(User, {
        where: { id: user.id },
        relations: {
          collections: {
            category: true,
            contents: true,
          },
          categories: true,
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

      // Update title and comment if they are not empty
      title ? (collectionInDb.title = title) : null;
      comment ? (collectionInDb.comment = comment) : null;

      // Update category if it is not empty
      let category: Category = null;
      if (categoryName) {
        category = await getOrCreateCategory(categoryName, queryRunnerManager);
        userInDb.categories.push(category);

        // Update user categories
        if (collectionInDb.category) {
          const userCurrentCategories = userInDb.categories.filter(
            (category) => category.name === collectionInDb.category.name,
          );
          if (userCurrentCategories.length === 1) {
            userInDb.categories = userInDb.categories.filter(
              (category) => category.name !== collectionInDb.category.name,
            );
          }
        }

        await queryRunnerManager.save(userInDb);
      }

      // Update nested contents if contentLinkList is not empty
      const prevOrder: number[] = collectionInDb.order;
      const newOrder: number[] = [];
      let nestedContentList: NestedContent[] = collectionInDb.contents;
      if (contentLinkList) {
        for (const contentLink of contentLinkList) {
          const nestedContentInDb = nestedContentList.filter(
            (nestedContent) => nestedContent.link === contentLink,
          )[0];
          if (nestedContentInDb) {
            newOrder.push(nestedContentInDb.id);
          } else {
            const { nestedContent } = await this.addNestedContent({
              link: contentLink,
            });
            nestedContentList.push(nestedContent);
            newOrder.push(nestedContent.id);
          }
        }

        // Remove deleted contents from collection
        const deletedContents = prevOrder.filter(
          (contentId) => !newOrder.includes(contentId),
        );

        for (const contentId of deletedContents) {
          const contentToDelete = await queryRunnerManager.findOne(
            NestedContent,
            {
              where: { id: contentId },
            },
          );
          nestedContentList = nestedContentList.filter(
            (nestedContent) => nestedContent.id !== contentId,
          );
          await queryRunnerManager.remove(contentToDelete);
        }
      }

      // Update collection to database
      await queryRunnerManager.save(Collection, {
        ...collectionInDb,
        ...(contentLinkList && {
          order: newOrder,
          contents: nestedContentList,
        }),
        ...(category && { category }),
      });
      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
      throw new HttpException(e.message, e.status);
    }
  }

  // async addNestedContentToCollection(
  //   user: User,
  //   {
  //     collectionId,
  //     link,
  //     title,
  //     description,
  //   }: AddNestedContentToCollectionBodyDto,
  // ): Promise<AddNestedContentToCollectionOutput> {
  //   const queryRunner = await init(this.dataSource);
  //   const queryRunnerManager: EntityManager = await queryRunner.manager;
  //   try {
  //     const userInDb = await queryRunnerManager.findOne(User, {
  //       where: { id: user.id },
  //       relations: {
  //         collections: true,
  //       },
  //     });
  //     if (!userInDb) {
  //       throw new NotFoundException('User not found');
  //     }

  //     // Check if content exists
  //     const collectionInDb: Collection = userInDb.collections.filter(
  //       (collection) => collection.id === collectionId,
  //     )[0];
  //     if (!collectionInDb) {
  //       throw new NotFoundException('Collection not found.');
  //     }

  //     // Create collection order array
  //     const nestedContentList: NestedContent[] = collectionInDb.contents;

  //     // Create new nested content and add to collection order array
  //     const { nestedContent } = await this.addNestedContent({
  //       link,
  //       title,
  //       description,
  //     });
  //     nestedContentList.push(nestedContent);
  //     collectionInDb.order.push(nestedContent.id);

  //     // Update collection to database
  //     await queryRunnerManager.save(collectionInDb);
  //     await queryRunner.commitTransaction();

  //     return;
  //   } catch (e) {
  //     await queryRunner.rollbackTransaction();

  //     console.log(e);
  //     throw new HttpException(e.message, e.status);
  //   }
  // }

  // Add nested content to the database
  async addNestedContent({
    link,
    title,
    description,
  }: AddNestedContentBodyDto): Promise<AddNestedContentOutput> {
    const queryRunner = await init(this.dataSource);
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
      });
      await queryRunnerManager.save(newNestedContent);

      await queryRunner.commitTransaction();

      return { nestedContent: newNestedContent };
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new HttpException(e.message, e.status);
    }
  }

  async deleteCollection(
    user: User,
    collectionId: number,
  ): Promise<DeleteCollectionOutput> {
    const queryRunner = await init(this.dataSource);
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

      // Check if collection exists
      const collectionInDb: Collection = userInDb.collections.filter(
        (collection) => collection.id === collectionId,
      )[0];
      if (!collectionInDb) {
        throw new NotFoundException('Collection not found.');
      }

      // Delete collection from database
      await queryRunnerManager.remove(collectionInDb);
      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      console.log(e);
      throw new HttpException(e.message, e.status);
    }
  }
}
