import { Module } from '@nestjs/common';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { ContentsModule } from 'src/contents/contents.module';
import { Category } from 'src/contents/entities/category.entity';
import { customCategoryRepositoryMethods } from 'src/contents/repository/category.repository';
import { DataSource } from 'typeorm';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), ContentsModule],
  controllers: [CollectionsController],
  providers: [
    CollectionsService,
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
})
export class CollectionsModule {}
