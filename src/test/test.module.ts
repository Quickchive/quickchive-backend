import { Module } from '@nestjs/common';
import { CategoryModule } from '../categories/category.module';
import { ContentsModule } from '../contents/contents.module';

@Module({
  imports: [CategoryModule, ContentsModule],
})
export class TestModule {}
