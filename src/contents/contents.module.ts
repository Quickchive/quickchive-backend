import { Module } from '@nestjs/common';
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
import { customCategoryRepositoryMethods } from './repository/category.old.repository';
import { UserRepository } from '../users/repository/user.repository';
import { ContentRepository } from './repository/content.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content, Category])],
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
    UserRepository,
    ContentRepository,
  ],
  exports: [ContentsService],
})
export class ContentsModule {}
