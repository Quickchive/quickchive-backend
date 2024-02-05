import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
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
import { UserRepository } from '../users/repository/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: customJwtService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async jwtLogin({
    email,
    password,
    auto_login,
  }: LoginBodyDto): Promise<LoginOutput> {
    try {
      const { user } = await this.validateUser({ email, password });
      const payload: Payload = this.jwtService.createPayload(
        email,
        auto_login,
        user.id,
      );
      const refreshToken = await this.jwtService.generateRefreshToken(payload);
      await this.cacheManager.set(refreshToken, user.id, {
        ttl: auto_login
          ? refreshTokenExpirationInCache
          : refreshTokenExpirationInCacheShortVersion,
      });

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
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user) {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      const refreshTokenInCache: number | undefined =
        await this.cacheManager.get(refreshToken);

      if (refreshTokenInCache === undefined) {
        throw new NotFoundException('Refresh token not found');
      }

      if (refreshTokenInCache !== userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.cacheManager.del(refreshToken);

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
    const refreshTokenInCache = await this.cacheManager.get(refreshToken);

    if (!refreshTokenInCache) {
      throw new NotFoundException('There is no refresh token');
    }

    const user = await this.userRepository.findOneBy({ id: decoded.sub });
    const auto_login: boolean = decoded.period === ONEYEAR;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload: Payload = this.jwtService.createPayload(
      user.email,
      auto_login,
      user.id,
    );
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.jwtService.generateRefreshToken(payload);

    await this.cacheManager.del(refreshToken);
    await this.cacheManager.set(newRefreshToken, user.id, {
      ttl: auto_login
        ? refreshTokenExpirationInCache
        : refreshTokenExpirationInCacheShortVersion,
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async sendPasswordResetEmail(
    email: string,
  ): Promise<sendPasswordResetEmailOutput> {
    const user = await this.userRepository.findOneBy({ email });
    if (user) {
      if (!user.verified) {
        throw new UnauthorizedException('User not verified');
      }
      // Email Verification
      const code: string = uuidv4();
      await this.cacheManager.set(code, user.id, {
        ttl: verifyEmailExpiration,
      });

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
      const user = await this.userRepository.findOne({
        where: { email },
        select: { id: true, password: true },
      });
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
