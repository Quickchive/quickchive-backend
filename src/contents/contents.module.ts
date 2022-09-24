import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { CategoryController, ContentsController } from './contents.controller';
import { CategoryService, ContentsService } from './contents.service';
import { Content } from './entities/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content])],
  controllers: [ContentsController, CategoryController],
  providers: [ContentsService, CategoryService],
})
export class ContentsModule {}
