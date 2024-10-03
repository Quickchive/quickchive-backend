import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { UserDomainModule } from '../../domain/user/user.module';

@Module({
  imports: [RedisModule, UserDomainModule],
  controllers: [UsersController],
})
export class UsersModule {}
