import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisProvider = (): Provider => {
  return {
    provide: 'REDIS_MASTER',
    useFactory: async (configService: ConfigService) => {
      return await new Promise((resolve) => {
        const redis = new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          enableReadyCheck: true,
          retryStrategy: () => 10 * 1000 * 6,
        });

        redis.once('ready', () => {
          resolve(redis);
        });
      });
    },
    inject: [ConfigService],
  };
};
