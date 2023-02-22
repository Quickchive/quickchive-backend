import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../contents/entities/content.entity';
import { TaskService } from './task.service';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Content])],
  providers: [TaskService],
})
export class BatchModule {}
