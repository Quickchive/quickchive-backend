import { Module } from '@nestjs/common';
import { ContentsModule } from '../contents/contents.module';
import { CategoryService } from './category.service';
import { OpenaiModule } from '../openai/openai.module';
import { UsersModule } from '../presentation/user/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryController } from './category.controller';
import { ContentRepository } from '../contents/repository/content.repository';
import { CategoryRepository } from './category.repository';
import { UserDomainModule } from '../domain/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    ContentsModule,
    OpenaiModule,
    UserDomainModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService, ContentRepository, CategoryRepository],
  exports: [CategoryRepository],
})
export class CategoryModule {}
