import { CacheModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/users/entities/refresh-token.entity';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import * as redisStore from 'cache-manager-redis-store';

const accessTokenExpiration = '2m';
export const refreshTokenExpiration = '30d';
export const refreshTokenExpirationInCache = 60 * 60 * 24 * 30;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
        signOptions: { expiresIn: accessTokenExpiration },
      }),
    }),
    TypeOrmModule.forFeature([User, Verification, RefreshToken]),
    CacheModule.register({
      store: redisStore,
      ...(process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            port: 6379,
          }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
