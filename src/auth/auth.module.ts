import { CacheModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuthController, OauthController } from './auth.controller';
import { AuthService, OauthService } from './auth.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import * as redisStore from 'cache-manager-redis-store';
import { GoogleStrategy } from './passport/google/google.strategy';

const accessTokenExpiration = '10m';
export const refreshTokenExpiration = '30d';
export const refreshTokenExpirationInCache = 60 * 60 * 24 * 30;
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
  providers: [AuthService, JwtStrategy, OauthService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
