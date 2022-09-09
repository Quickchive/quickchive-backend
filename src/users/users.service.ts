import {
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Content } from 'src/contents/entities/content.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoadPersonalCategoriesOutput } from './dtos/load-personal-categories.dto';
import {
  LoadFavoritesOutput,
  LoadPersonalContentsOutput,
} from './dtos/load-personal-contents.dto';
import {
  ResetPasswordInput,
  ResetPasswordOutput,
} from './dtos/reset-password.dto';
import { User } from './entities/user.entity';
import { Cache } from 'cache-manager';
import { LoadPersonalCollectionsOutput } from './dtos/load-personal-collections.dto';
import { init } from 'src/utils';
import { Collection } from 'src/collections/entities/collection.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async editProfile(
    userId: number,
    { password, oldPassword, name }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    const queryRunner = await init(this.dataSource);
    const queryRunnerManager: EntityManager = await queryRunner.manager;
    try {
      const user = await queryRunnerManager.findOne(User, {
        where: { id: userId },
        select: { id: true, email: true, name: true, password: true },
      });

      if (name) {
        user.name = name;
      }

      if (password && oldPassword) {
        if (user.checkPassword(oldPassword)) user.password = password;
        else throw new UnauthorizedException('The password is incorrect');
      } else {
        delete user.password;
      }

      await queryRunnerManager.save(user);

      await queryRunner.commitTransaction();

      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new HttpException(e.message, e.status ? e.status : 500);
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword({
    code,
    password,
  }: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const queryRunner = await init(this.dataSource);
    const queryRunnerManager: EntityManager = queryRunner.manager;
    try {
      const userId: number = await this.cacheManager.get(code);

      if (userId) {
        const user = await queryRunnerManager.findOne(User, {
          where: { id: userId },
          select: { id: true, password: true },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        user.password = password;

        await queryRunnerManager.save(user); // update password
        await this.cacheManager.del(code); // delete verification value

        await queryRunner.commitTransaction();

        return;
      } else {
        throw new NotFoundException('Reset Code not found');
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new HttpException(e.message, e.status ? e.status : 500);
    } finally {
      await queryRunner.release();
    }
  }

  async loadPersonalContents(
    user: User,
    categoryId: number,
  ): Promise<LoadPersonalContentsOutput> {
    try {
      let { contents } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
        },
      });
      if (categoryId) {
        if (categoryId === -1) {
          contents = contents.filter((content) => !content.category);
        } else {
          contents = contents.filter(
            (content) => content?.category?.id === categoryId,
          );
        }
      }

      return {
        contents,
      };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  async loadFavorites(user: User): Promise<LoadFavoritesOutput> {
    try {
      const { contents, collections } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
          collections: {
            // category: true,
            contents: true,
          },
        },
      });

      const favoriteContents: Content[] = contents.filter(
        (content) => content.favorite,
      );

      const favoriteCollections: Collection[] = collections.filter(
        (collection) => collection.favorite,
      );

      return {
        favorite_contents: favoriteContents,
        favorite_collections: favoriteCollections,
      };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  async loadPersonalCollections(
    user: User,
    categoryId: number,
  ): Promise<LoadPersonalCollectionsOutput> {
    try {
      let { collections } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          collections: {
            category: true,
            contents: true,
          },
        },
      });
      if (categoryId) {
        if (categoryId === -1) {
          collections = collections.filter(
            (collection) => !collection.category,
          );
        } else {
          collections = collections.filter(
            (collection) => collection?.category?.id === categoryId,
          );
        }
      }

      return {
        collections,
      };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  async loadPersonalCategories(
    user: User,
  ): Promise<LoadPersonalCategoriesOutput> {
    try {
      const { categories } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          categories: true,
        },
      });

      return {
        categories,
      };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }
}
