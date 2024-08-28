import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.factory';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisProvider(), RedisService],
  exports: [RedisService],
})
export class RedisModule {}
