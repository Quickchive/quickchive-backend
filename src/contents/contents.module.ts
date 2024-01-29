import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { Category } from '../categories/category.entity';
import { Content } from './entities/content.entity';
import { CategoryUtil } from './util/category.util';
import { ContentRepository } from './repository/content.repository';
import { CategoryRepository } from '../categories/category.repository';
import { UsersModule } from '../users/users.module';
import { ContentUtil } from './util/content.util';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Content]), UsersModule, OpenaiModule],
  controllers: [ContentsController],
  providers: [
    ContentsService,
    ContentRepository,
    ContentUtil,
    CategoryRepository,
    CategoryUtil,
  ],
  exports: [ContentsService],
})
export class ContentsModule {}
