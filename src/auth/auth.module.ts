import { CacheModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import * as redisStore from 'cache-manager-redis-store';
import { GoogleStrategy } from './passport/google/google.strategy';
import { customJwtService } from './jwt/jwt.service';
import { TWOHOUR } from './jwt/jwt.payload';
import { UsersModule } from '../users/users.module';
import { OAuthUtil } from './util/oauth.util';
import { ContentsModule } from '../contents/contents.module';
import { OAuthService } from './oauth.service';
import { CategoryModule } from '../categories/category.module';

const accessTokenExpiration = TWOHOUR;
export const refreshTokenExpirationInCache = 60 * 60 * 24 * 365; // 1 year
export const refreshTokenExpirationInCacheShortVersion = 60 * 60 * 24 * 2;
export const verifyEmailExpiration = 60 * 5;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
        signOptions: { expiresIn: accessTokenExpiration },
      }),
    }),
    UsersModule,
    ContentsModule,
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
    CategoryModule,
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OAuthService,
    OAuthUtil,
    GoogleStrategy,
    customJwtService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
