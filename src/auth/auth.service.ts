import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { MailService } from '../mail/mail.service';
import {
  refreshTokenExpirationInCache,
  refreshTokenExpirationInCacheShortVersion,
  verifyEmailExpiration,
} from './auth.module';
import {
  LoginBodyDto,
  LoginOutput,
  LogoutBodyDto,
  LogoutOutput,
} from './dtos/login.dto';
import { sendPasswordResetEmailOutput } from './dtos/send-password-reset-email.dto';
import { RefreshTokenDto, RefreshTokenOutput } from './dtos/token.dto';
import { ValidateUserDto, ValidateUserOutput } from './dtos/validate-user.dto';
import { ONEYEAR, Payload } from './jwt/jwt.payload';
import { customJwtService } from './jwt/jwt.service';
import { UserRepository } from '../domain/user/user.repository';
import { RedisService } from '../infrastructure/redis/redis.service';
import { PASSWORD_CODE_KEY, REFRESH_TOKEN_KEY } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: customJwtService,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  async jwtLogin({ email, password }: LoginBodyDto): Promise<LoginOutput> {
    try {
      const autoLogin = true;
      const { user } = await this.validateUser({ email, password });
      const payload: Payload = this.jwtService.createPayload(
        email,
        autoLogin,
        user.id,
      );
      const refreshToken = await this.jwtService.generateRefreshToken(payload);

      await this.redisService.set(
        `${REFRESH_TOKEN_KEY}:${user.id}`,
        refreshToken,
        refreshTokenExpirationInCache,
      );

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
      };
    } catch (e) {
      throw e;
    }
  }

  async logout(
    userId: number,
    { refresh_token: refreshToken }: LogoutBodyDto,
  ): Promise<LogoutOutput> {
    const user = await this.userRepository.findById(userId);
    if (user) {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      const refreshTokenInCache: string | null = await this.redisService.get(
        `${REFRESH_TOKEN_KEY}:${user.id}`,
      );

      if (!refreshTokenInCache) {
        throw new NotFoundException('Refresh token not found');
      }

      await this.redisService.del(`${REFRESH_TOKEN_KEY}:${user.id}`);

      return {};
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async reissueToken({
    refresh_token: refreshToken,
  }: RefreshTokenDto): Promise<RefreshTokenOutput> {
    let decoded: Payload;
    try {
      // decoding refresh token
      decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userRepository.findById(decoded.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const refreshTokenInCache = await this.redisService.get(
      `${REFRESH_TOKEN_KEY}:${user.id}`,
    );

    if (!refreshTokenInCache) {
      throw new NotFoundException('There is no refresh token');
    }

    const auto_login: boolean = decoded.period === ONEYEAR;

    const payload: Payload = this.jwtService.createPayload(
      user.email,
      auto_login,
      user.id,
    );
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.jwtService.generateRefreshToken(payload);

    await this.redisService.set(
      `${REFRESH_TOKEN_KEY}:${user.id}`,
      newRefreshToken,
      auto_login
        ? refreshTokenExpirationInCache
        : refreshTokenExpirationInCacheShortVersion,
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async sendPasswordResetEmail(
    email: string,
  ): Promise<sendPasswordResetEmailOutput> {
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      if (!user.verified) {
        throw new UnauthorizedException('User not verified');
      }
      // Email Verification
      const code: string = uuidv4();
      await this.redisService.set(
        `${PASSWORD_CODE_KEY}:${code}`,
        user.id.toString(),
        verifyEmailExpiration,
      );

      // send password reset email to user using mailgun
      this.mailService.sendResetPasswordEmail(user.email, user.name, code);

      return {};
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async validateUser({
    email,
    password,
  }: ValidateUserDto): Promise<ValidateUserOutput> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      const isPasswordCorrect = await user.checkPassword(password);

      if (isPasswordCorrect) {
        return { user };
      } else {
        throw new BadRequestException('Wrong Password');
      }
    } catch (e) {
      throw e;
    }
  }
}
