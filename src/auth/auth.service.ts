import {
  BadRequestException,
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { Repository } from 'typeorm';
import {
  refreshTokenExpiration,
  refreshTokenExpirationInCache,
} from './auth.module';
import {
  CreateAccountBodyDto,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import {
  LoginBodyDto,
  LoginOutput,
  LogoutBodyDto,
  LogoutOutput,
} from './dtos/login.dto';
import { sendPasswordResetEmailOutput } from './dtos/send-password-reset-email.dto';
import { RefreshTokenDto, RefreshTokenOutput } from './dtos/token.dto';
import { ValidateUserDto, ValidateUserOutput } from './dtos/validate-user.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { Payload } from './jwt/jwt.payload';
import { Cache } from 'cache-manager';
// import { v4 as uuidv4 } from 'uuid';
// import { stringify } from 'querystring';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async jwtLogin({ email, password }: LoginBodyDto): Promise<LoginOutput> {
    try {
      const { user } = await this.validateUser({ email, password });
      if (user) {
        const payload: Payload = { email, sub: user.id };
        const refreshToken = await this.generateRefreshToken(payload);
        // user.refresh_token = refreshToken;
        // await this.refreshTokens.save({ refreshToken, userId: user.id });
        await this.cacheManager.set(refreshToken, user.id, {
          ttl: refreshTokenExpirationInCache,
        });

        return {
          access_token: this.jwtService.sign(payload),
          refresh_token: refreshToken,
        };
      } else {
        throw new UnauthorizedException('Error in login');
      }
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async register({
    email,
    name,
    password,
  }: CreateAccountBodyDto): Promise<CreateAccountOutput> {
    try {
      const user = await this.users.findOneBy({ email });

      if (!user) {
        throw new NotFoundException('User Not Found');
      } else if (user.verified) {
        user.name = name;
        user.password = password;
        await this.users.save(user);

        return;
      } else {
        throw new BadRequestException('User is not verified');
      }
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, e.statusCode);
    }
  }

  async logout(
    userId: number,
    { refresh_token: refreshToken }: LogoutBodyDto,
  ): Promise<LogoutOutput> {
    const user = await this.users.findOneBy({ id: userId });
    if (user) {
      if (refreshToken && typeof refreshToken === 'string') {
        const refreshTokenInCache = await this.cacheManager.get(refreshToken);

        if (refreshTokenInCache) {
          if (refreshTokenInCache === userId) {
            await this.cacheManager.del(refreshToken);
            return;
          } else {
            throw new BadRequestException('Invalid refresh token');
          }
        } else {
          throw new NotFoundException('Refresh token not found');
        }
      } else {
        throw new BadRequestException('Invalid refresh token');
      }
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async deleteAccount(userId: number): Promise<DeleteAccountOutput> {
    const { affected } = await this.users.delete(userId);

    if (affected === 1) {
      return;
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async reissueToken({
    refresh_token: refreshToken,
  }: RefreshTokenDto): Promise<RefreshTokenOutput> {
    // decoding refresh token
    const decoded = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
    });

    // const refreshTokenInDb = await this.refreshTokens.findOneBy({
    //   refreshToken,
    // });

    const refreshTokenInCache = await this.cacheManager.get(refreshToken);

    if (!refreshTokenInCache) {
      throw new NotFoundException('There is no refresh token');
    }

    const user = await this.users.findOneBy({ id: decoded.sub });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload: Payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(payload);

    await this.cacheManager.del(refreshToken);
    await this.cacheManager.set(newRefreshToken, user.id, {
      ttl: refreshTokenExpirationInCache,
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async sendVerifyEmail(email: string): Promise<VerifyEmailOutput> {
    const user = await this.users.findOneBy({ email });
    if (user) {
      throw new BadRequestException('Already exist');
    }
    const newUser = await this.users.save(
      this.users.create({ email, name: 'unverified', password: 'unverified' }),
    );

    // Email Verification
    const verification = await this.verifications.save(
      this.verifications.create({ user: newUser }),
    );

    this.mailService.sendVerificationEmail(
      newUser.email,
      newUser.name,
      verification.code,
    );

    return;
  }

  async sendPasswordResetEmail(
    email: string,
  ): Promise<sendPasswordResetEmailOutput> {
    const user = await this.users.findOneBy({ email });
    if (user) {
      if (!user.verified) {
        throw new UnauthorizedException('User not verified');
      }
      const verification = await this.verifications.save(
        this.verifications.create({ user }),
      );

      // send password reset email to user using mailgun
      this.mailService.sendResetPasswordEmail(
        user.email,
        user.name,
        verification.code,
      );

      return;
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    const verification = await this.verifications.findOne({
      where: { code },
      relations: { user: true },
    });

    if (verification.code === code) {
      verification.user.verified = true;
      this.users.save(verification.user); // verify
      await this.verifications.delete(verification.id); // delete verification value

      return;
    } else {
      throw new NotFoundException('Verification code not found');
    }
  }

  async validateUser({
    email,
    password,
  }: ValidateUserDto): Promise<ValidateUserOutput> {
    try {
      const user = await this.users.findOne({
        where: { email },
        select: { id: true, password: true },
      });
      if (!user) {
        throw new UnauthorizedException('User Not Found');
      }

      const isPasswordCorrect = await user.checkPassword(password);
      delete user.password;

      if (isPasswordCorrect) {
        return { user };
      } else {
        throw new UnauthorizedException('Wrong Password');
      }
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async generateRefreshToken(payload: Payload): Promise<string> {
    return await this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
      expiresIn: refreshTokenExpiration,
    });
  }
}
