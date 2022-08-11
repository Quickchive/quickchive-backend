import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Verification]),
    CacheModule.register({
      store: redisStore,
      ...(process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            port: 6379,
          }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
