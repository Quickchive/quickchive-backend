import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { Content } from './entities/content.entity';
import { ContentRepository } from './repository/content.repository';
import { CategoryRepository } from '../categories/category.repository';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/openai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Content]), UsersModule, AiModule],
  controllers: [ContentsController],
  providers: [ContentsService, ContentRepository, CategoryRepository],
  exports: [ContentsService],
})
export class ContentsModule {}
