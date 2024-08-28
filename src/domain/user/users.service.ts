import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  EditProfileDto,
  EditProfileOutput,
} from '../../users/dtos/edit-profile.dto';
import {
  ResetPasswordInput,
  ResetPasswordOutput,
} from '../../users/dtos/reset-password.dto';
import { User } from './entities/user.entity';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PASSWORD_CODE_KEY } from '../../auth/constants';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  async editProfile(
    userId: number,
    { password, oldPassword, name }: EditProfileDto,
    queryRunnerManager: EntityManager,
  ): Promise<EditProfileOutput> {
    try {
      const user = await queryRunnerManager.findOneOrFail(User, {
        where: { id: userId },
        select: { id: true, email: true, name: true, password: true },
      });

      user.name = name;

      if (password && oldPassword) {
        if (await user?.checkPassword(oldPassword)) user.password = password;
        else throw new UnauthorizedException('The password is incorrect');
      }
      await queryRunnerManager.save(user);

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
      const userId = await this.redisService.get(
        `${PASSWORD_CODE_KEY}:${code}`,
      );

      if (userId) {
        const user = await queryRunnerManager.findOne(User, {
          where: { id: parseInt(userId) },
          select: { id: true, password: true },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        user.password = password;

        await queryRunnerManager.save(user); // update password
        await this.redisService.del(`${PASSWORD_CODE_KEY}:${code}`); // delete verification value

        return {};
      } else {
        throw new NotFoundException('Reset Code not found');
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.userRepository.findByIdWithContents(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.deleteById(userId);
  }
}
