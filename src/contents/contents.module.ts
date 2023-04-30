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
import { UserRepository } from '../users/repository/user.repository';
import { ContentRepository } from './repository/content.repository';
import { CategoryUtil } from './util/category.util';
import { CategoryRepository } from './repository/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content, Category])],
  controllers: [ContentsController, CategoryController, TestController],
  providers: [
    ContentsService,
    CategoryService,
    UserRepository,
    ContentRepository,
    CategoryRepository,
    CategoryUtil,
  ],
  exports: [ContentsService],
})
export class ContentsModule {}
