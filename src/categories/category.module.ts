import { Module } from '@nestjs/common';
import { ContentsModule } from '../contents/contents.module';
import { CategoryService } from './category.service';
import { CategoryUtil } from '../contents/util/category.util';
import { OpenaiModule } from '../openai/openai.module';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryController } from './category.controller';
import { ContentRepository } from '../contents/repository/content.repository';
import { CategoryRepository } from './category.repository';
import { ContentUtil } from '../contents/util/content.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    ContentsModule,
    OpenaiModule,
    UsersModule,
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryUtil,
    ContentRepository,
    CategoryRepository,
    ContentUtil,
  ],
  exports: [CategoryRepository],
})
export class CategoryModule {}
