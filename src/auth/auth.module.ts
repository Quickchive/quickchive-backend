import { CacheModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthController, OauthController } from './auth.controller';
import { AuthService, OauthService } from './auth.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import * as redisStore from 'cache-manager-redis-store';
import { GoogleStrategy } from './passport/google/google.strategy';
import { customJwtService } from './jwt/jwt.service';
import { TWOHOUR } from './jwt/jwt.payload';
import { UserRepository } from '../users/repository/user.repository';

const accessTokenExpiration = TWOHOUR;
export const refreshTokenExpirationInCache = 60 * 60 * 24 * 30;
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
    TypeOrmModule.forFeature([User]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
  ],
  controllers: [AuthController, OauthController],
  providers: [
    AuthService,
    JwtStrategy,
    OauthService,
    GoogleStrategy,
    customJwtService,
    UserRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
