import { Module } from '@nestjs/common';
import { CategoryController, ContentsController } from './contents.controller';
import { CategoryService, ContentsService } from './contents.service';

@Module({
  imports: [],
  controllers: [ContentsController, CategoryController],
  providers: [ContentsService, CategoryService],
})
export class ContentsModule {}
