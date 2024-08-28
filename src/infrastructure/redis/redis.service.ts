import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_MASTER') private readonly redisMaster: Redis) {}

  /**
   * Set Value in Redis
   * @param key redis key
   * @param value redis value
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.redisMaster.set(key, value);
    if (ttl) {
      await this.redisMaster.expire(key, ttl);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redisMaster.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisMaster.del(key);
  }
}
