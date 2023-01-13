import { CacheModule, Module } from '@nestjs/common';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import {
  CategoryController,
  ContentsController,
  TestController,
} from './contents.controller';
import { CategoryService, ContentsService } from './contents.service';
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';
import { customCategoryRepositoryMethods } from './repository/category.repository';
import * as redisStore from 'cache-manager-redis-store';

// 카테고리에 저장된 콘텐츠 카운트 캐시에 2달간 저장을 위한 시간 값
export const categoryCountExpirationInCache = 60 * 60 * 24 * 60;

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Content, Category]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
  ],
  controllers: [ContentsController, CategoryController, TestController],
  providers: [
    ContentsService,
    CategoryService,
    {
      provide: getRepositoryToken(Category),
      inject: [getDataSourceToken()],
      useFactory(dataSource: DataSource) {
        // Override default repository for Category with a custom one
        return dataSource
          .getRepository(Category)
          .extend(customCategoryRepositoryMethods);
      },
    },
  ],
  exports: [ContentsService],
})
export class ContentsModule {}
