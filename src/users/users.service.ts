import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Content } from 'src/contents/entities/content.entity';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
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
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly mailService: MailService,
  ) {}

  async editProfile(
    userId: number,
    { email, password, oldPassword, name }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({
        where: { id: userId },
        select: { id: true, email: true, name: true, password: true },
      });

      if (email) {
        user.email = email;
        user.verified = false;

        // Email Verification
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );

        this.mailService.sendVerificationEmail(
          user.email,
          user.name,
          verification.code,
        );
      }

      if (name) {
        user.name = name;
      }

      if (password && oldPassword) {
        if (user.checkPassword(oldPassword)) user.password = password;
        else throw new UnauthorizedException('The password is incorrect');
      } else {
        delete user.password;
      }

      await this.users.save(user);

      return;
    } catch (e) {
      throw new HttpException(e.message, e.statusCode);
    }
  }

  async resetPassword({
    code,
    password,
  }: ResetPasswordInput): Promise<ResetPasswordOutput> {
    try {
      const verification = await this.verifications.findOne({
        where: { code },
        relations: { user: true },
      });

      if (verification) {
        const user = await this.users.findOne({
          where: { id: verification.user.id },
          select: { id: true, password: true },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        user.password = password;

        await this.verifications.delete(verification.id);
        await this.users.save(user);

        return;
      } else {
        throw new NotFoundException('Reset Code not found');
      }
    } catch (e) {
      throw new HttpException(e.message, e.statusCode);
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
        contents = contents.filter(
          (content) => content?.category?.id === categoryId,
        );
      }

      return {
        contents,
      };
    } catch (e) {
      throw new HttpException(e.message, e.statusCode);
    }
  }

  async loadFavorites(user: User): Promise<LoadFavoritesOutput> {
    try {
      const { contents } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: true,
        },
      });

      const favorites: Content[] = contents.filter(
        (content) => content.favorite,
      );

      return {
        favorites,
      };
    } catch (e) {
      throw new HttpException(e.message, e.statusCode);
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
      throw new HttpException(e.message, e.statusCode);
    }
  }
}
