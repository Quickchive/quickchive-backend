import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/contents/entities/category.entity';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
