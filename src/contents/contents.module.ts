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
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, Category]),
    UsersModule,
    OpenaiModule,
  ],
  controllers: [ContentsController, CategoryController, TestController],
  providers: [
    ContentsService,
    CategoryService,
    ContentRepository,
    CategoryRepository,
    CategoryUtil,
    ContentUtil,
  ],
  exports: [ContentsService, CategoryRepository],
})
export class ContentsModule {}
