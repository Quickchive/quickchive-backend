import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AddCollectionBodyDto,
  AddCollectionOutput,
  DeleteCollectionOutput,
  UpdateCollectionBodyDto,
  UpdateCollectionOutput,
} from './dtos/collection.dto';
import { Collection } from './entities/collection.entity';
import { NestedContent } from './entities/nested-content.entity';
import {
  AddNestedContentBodyDto,
  AddNestedContentOutput,
} from './dtos/nested-content.dto';
import { toggleFavoriteOutput } from 'src/contents/dtos/content.dto';
import { Category } from '../contents/entities/category.entity';
import { CategoryRepository } from '../contents/repository/category.old.repository';
import { ContentsService } from '../contents/contents.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: CategoryRepository,
    private readonly contentsService: ContentsService,
  ) {}

  // async addCollection(
  //   user: User,
  //   { title, comment, contentLinkList, categoryName }: AddCollectionBodyDto,
  //   queryRunnerManager: EntityManager,
  // ): Promise<AddCollectionOutput> {
  // try {
  //   const userInDb = await queryRunnerManager.findOne(User, {
  //     where: { id: user.id },
  //     relations: {
  //       collections: true,
  //       categories: true,
  //     },
  //   });
  //   if (!userInDb) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Check if content already exists
  //   if (
  //     userInDb.collections.filter(
  //       (collection) => collection.title === title,
  //     )[0]
  //   ) {
  //     throw new ConflictException(
  //       'Collection with that title already exists.',
  //     );
  //   }

  //   // Create collection order array
  //   let nestedContentList: NestedContent[] = [];
  //   // Load contents if contentLinkList is not empty
  //   if (contentLinkList) {
  //     for (const contentLink of contentLinkList) {
  //       const { nestedContent } = await this.addNestedContent(
  //         {
  //           link: contentLink,
  //         },
  //         queryRunnerManager,
  //       );
  //       nestedContentList.push(nestedContent);
  //     }
  //   }

  //   // Create collection order
  //   const order: number[] = [
  //     ...nestedContentList.map((content) => content.id),
  //   ];

  //   // Get or create category
  //   const category = categoryName
  //     ? await this.categories.getOrCreate(categoryName, queryRunnerManager)
  //     : null;

  //   // Create collection
  //   const newCollection = queryRunnerManager.create(Collection, {
  //     title,
  //     comment,
  //     contents: nestedContentList,
  //     order,
  //     user,
  //     category,
  //   });
  //   await queryRunnerManager.save(newCollection);

  //   // Add collection to user
  //   userInDb.collections.push(newCollection);
  //   categoryName ? userInDb.categories.push(category) : null;
  //   await queryRunnerManager.save(userInDb);

  // return;
  // } catch (e) {
  //   throw e;
  // }
  // }

  // async updateCollection(
  //   user: User,
  //   {
  //     collectionId,
  //     title,
  //     comment,
  //     categoryName,
  //     favorite,
  //     contentLinkList,
  //   }: UpdateCollectionBodyDto,
  //   queryRunnerManager: EntityManager,
  // ): Promise<UpdateCollectionOutput> {
  // try {
  //   const userInDb = await queryRunnerManager.findOne(User, {
  //     where: { id: user.id },
  //     relations: {
  //       collections: {
  //         category: true,
  //         contents: true,
  //       },
  //       categories: true,
  //     },
  //   });
  //   if (!userInDb) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Check if content exists
  //   const collectionInDb: Collection = userInDb.collections.filter(
  //     (collection) => collection.id === collectionId,
  //   )[0];
  //   if (!collectionInDb) {
  //     throw new NotFoundException('Collection not found.');
  //   }

  //   // Update title, comment and favorite if they are not empty
  //   title ? (collectionInDb.title = title) : null;
  //   comment ? (collectionInDb.comment = comment) : null;
  //   favorite !== undefined ? (collectionInDb.favorite = favorite) : null;

  //   // Update category if it is not empty
  //   let category: Category = null;
  //   if (categoryName) {
  //     category = await this.categories.getOrCreate(
  //       categoryName,
  //       queryRunnerManager,
  //     );
  //     if (!userInDb.categories.includes(category)) {
  //       userInDb.categories.push(category);
  //       await queryRunnerManager.save(userInDb);
  //     }
  //   }

  //   // Update nested contents if contentLinkList is not empty
  //   const prevOrder: number[] = collectionInDb.order;
  //   const newOrder: number[] = [];
  //   let nestedContentList: NestedContent[] = collectionInDb.contents;
  //   if (contentLinkList) {
  //     for (const contentLink of contentLinkList) {
  //       const nestedContentInDb = nestedContentList.filter(
  //         (nestedContent) => nestedContent.link === contentLink,
  //       )[0];
  //       if (nestedContentInDb) {
  //         newOrder.push(nestedContentInDb.id);
  //       } else {
  //         const { nestedContent } = await this.addNestedContent(
  //           {
  //             link: contentLink,
  //           },
  //           queryRunnerManager,
  //         );
  //         nestedContentList.push(nestedContent);
  //         newOrder.push(nestedContent.id);
  //       }
  //     }

  //     // Remove deleted contents from collection
  //     const deletedContents = prevOrder.filter(
  //       (contentId) => !newOrder.includes(contentId),
  //     );

  //     for (const contentId of deletedContents) {
  //       const contentToDelete = await queryRunnerManager.findOne(
  //         NestedContent,
  //         {
  //           where: { id: contentId },
  //         },
  //       );
  //       nestedContentList = nestedContentList.filter(
  //         (nestedContent) => nestedContent.id !== contentId,
  //       );
  //       await queryRunnerManager.remove(contentToDelete);
  //     }
  //   }

  //   // Update collection to database
  //   await queryRunnerManager.save(Collection, {
  //     ...collectionInDb,
  //     ...(contentLinkList && {
  //       order: newOrder,
  //       contents: nestedContentList,
  //     }),
  //     ...(category && { category }),
  //   });

  // return;
  // } catch (e) {
  //   throw e;
  // }
  // }

  // Add nested content to the database
  // async addNestedContent(
  //   { link }: AddNestedContentBodyDto,
  //   queryRunnerManager: EntityManager,
  // ): Promise<AddNestedContentOutput> {
  //   try {
  //     // get og tag info from link
  //     const { title, description, coverImg } =
  //       await this.contentsService.getLinkInfo(link);

  //     const newNestedContent = queryRunnerManager.create(NestedContent, {
  //       link,
  //       title,
  //       coverImg,
  //       description,
  //     });
  //     await queryRunnerManager.save(newNestedContent);

  //     return { nestedContent: newNestedContent };
  //   } catch (e) {
  //     throw e;
  //   }
  // }

  // async toggleFavorite(
  //   user: User,
  //   collectionId: number,
  //   queryRunnerManager: EntityManager,
  // ): Promise<toggleFavoriteOutput> {
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

  //     const collection = userInDb.collections.filter(
  //       (collection) => collection.id === collectionId,
  //     )[0];

  //     if (!collection) {
  //       throw new NotFoundException('collection not found.');
  //     }

  //     collection.favorite = !collection.favorite;
  //     await queryRunnerManager.save(collection);

  //     return;
  //   } catch (e) {
  //     throw e;
  //   }
  // }

  // async deleteCollection(
  //   user: User,
  //   collectionId: number,
  //   queryRunnerManager: EntityManager,
  // ): Promise<DeleteCollectionOutput> {
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

  //     // Check if collection exists
  //     const collectionInDb: Collection = userInDb.collections.filter(
  //       (collection) => collection.id === collectionId,
  //     )[0];
  //     if (!collectionInDb) {
  //       throw new NotFoundException('Collection not found.');
  //     }

  //     // Delete collection from database
  //     await queryRunnerManager.remove(collectionInDb);

  //     return;
  //   } catch (e) {
  //     throw e;
  //   }
  // }
}
