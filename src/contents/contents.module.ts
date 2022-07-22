import { Module } from '@nestjs/common';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';

@Module({
  imports: [],
  controllers: [ContentsController],
  providers: [ContentsService],
})
export class ContentsModule {}
