import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';
import {
  CategoryController,
  ContentsController,
  TestController,
} from './contents.controller';
import { CategoryService, ContentsService } from './contents.service';
import { Content } from './entities/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content]), DataSource],
  controllers: [ContentsController, CategoryController, TestController],
  providers: [ContentsService, CategoryService],
})
export class ContentsModule {}
