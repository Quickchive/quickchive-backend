import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CategoryController,
  ContentsController,
  TestController,
} from './contents.controller';
import { CategoryService, ContentsService } from './contents.service';
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';
import { CategoryUtil } from './util/category.util';
import { ContentRepository } from './repository/content.repository';
import { CategoryRepository } from './repository/category.repository';
import { UsersModule } from '../users/users.module';
import { ContentUtil } from './util/content.util';

@Module({
  imports: [TypeOrmModule.forFeature([Content, Category]), UsersModule],
  controllers: [ContentsController, CategoryController, TestController],
  providers: [
    ContentsService,
    CategoryService,
    ContentRepository,
    CategoryRepository,
    CategoryUtil,
    ContentUtil,
  ],
  exports: [ContentsService],
})
export class ContentsModule {}
