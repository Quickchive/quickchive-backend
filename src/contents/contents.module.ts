import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { Content } from './entities/content.entity';
import { ContentRepository } from './repository/content.repository';
import { CategoryRepository } from '../categories/category.repository';
import { UsersModule } from '../users/users.module';
import { OpenaiModule } from '../openai/openai.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content]),
    UsersModule,
    OpenaiModule,
    ClsModule,
  ],
  controllers: [ContentsController],
  providers: [ContentsService, ContentRepository, CategoryRepository],
  exports: [ContentsService],
})
export class ContentsModule {}
