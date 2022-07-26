import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoadPersonalCategoriesOutput } from './dtos/load-personal-categories.dto';
import { LoadPersonalContentsOutput } from './dtos/load-personal-contents.dto';
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
        else return { ok: false, error: 'The password is incorrect' };
      } else {
        delete user.password;
      }

      await this.users.save(user);

      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: 'Could not update profile.' };
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

        await this.users.save(user);

        return { ok: true };
      } else {
        throw new NotFoundException('Reset Code not found');
      }
    } catch (error) {
      console.log(error);
      return { ok: false, error: error.message };
    }
  }

  async loadPersonalContents(user: User): Promise<LoadPersonalContentsOutput> {
    try {
      const { contents } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
        },
      });

      return {
        ok: true,
        contents,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not load Contents',
      };
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
        ok: true,
        categories,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not load Categories',
      };
    }
  }
}
