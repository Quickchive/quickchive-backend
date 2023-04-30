import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import {
  ResetPasswordInput,
  ResetPasswordOutput,
} from './dtos/reset-password.dto';
import { User } from './entities/user.entity';
import { Cache } from 'cache-manager';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { UserRepository } from './repository/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async editProfile(
    userId: number,
    { password, oldPassword, name }: EditProfileInput,
    queryRunnerManager: EntityManager,
  ): Promise<EditProfileOutput> {
    try {
      const user = await queryRunnerManager.findOneOrFail(User, {
        where: { id: userId },
        select: { id: true, email: true, name: true, password: true },
      });

      if (name) {
        user.name = name;
      }

      interface UserWithoutPassword extends Omit<User, 'password'> {}

      if (password && oldPassword) {
        if (await user?.checkPassword(oldPassword)) user.password = password;
        else throw new UnauthorizedException('The password is incorrect');

        await queryRunnerManager.save(user);
      }
      // else {
      //   delete user.password;
      // }
      else {
        const userWithoutPassword: UserWithoutPassword = user;
        await queryRunnerManager.save(userWithoutPassword);
      }

      return {};
    } catch (e) {
      throw e;
    }
  }

  async resetPassword(
    { code, password }: ResetPasswordInput,
    queryRunnerManager: EntityManager,
  ): Promise<ResetPasswordOutput> {
    try {
      const userId: number | undefined = await this.cacheManager.get(code);

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

        return {};
      } else {
        throw new NotFoundException('Reset Code not found');
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteAccount(userId: number): Promise<DeleteAccountOutput> {
    const { affected } = await this.userRepository.delete(userId);

    if (affected === 1) {
      return {};
    } else {
      throw new NotFoundException('User not found');
    }
  }
}
