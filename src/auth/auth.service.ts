import {
  BadRequestException,
  CACHE_MANAGER,
  ConflictException,
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
import { Repository } from 'typeorm';
import {
  refreshTokenExpiration,
  refreshTokenExpirationInCache,
  verifyEmailExpiration,
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
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async jwtLogin({ email, password }: LoginBodyDto): Promise<LoginOutput> {
    try {
      const { user } = await this.validateUser({ email, password });
      const payload: Payload = { email, sub: user.id };
      const refreshToken = await this.generateRefreshToken(payload);
      await this.cacheManager.set(refreshToken, user.id, {
        ttl: refreshTokenExpirationInCache,
      });

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
      };
    } catch (e) {
      throw new HttpException(e.message, e.status);
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
        throw new NotFoundException('User is not verified');
      }
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, e.status);
    }
  }

  async logout(
    userId: number,
    { refresh_token: refreshToken }: LogoutBodyDto,
  ): Promise<LogoutOutput> {
    const user = await this.users.findOneBy({ id: userId });
    if (user) {
      if (refreshToken && typeof refreshToken === 'string') {
        const refreshTokenInCache: number = await this.cacheManager.get(
          refreshToken,
        );

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
    let newUser: User = null;
    if (user && user.verified === true) {
      throw new ConflictException('Already exist');
    } else if (user && user.verified === false) {
      newUser = user;
    } else {
      newUser = await this.users.save(
        this.users.create({
          email,
          name: 'unverified',
          password: 'unverified',
        }),
      );
    }

    // Email Verification
    const code: string = uuidv4();
    await this.cacheManager.set(code, newUser.id, {
      ttl: verifyEmailExpiration,
    });

    this.mailService.sendVerificationEmail(newUser.email, newUser.email, code);

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
      // Email Verification
      const code: string = uuidv4();
      await this.cacheManager.set(code, user.id, {
        ttl: verifyEmailExpiration,
      });

      // send password reset email to user using mailgun
      this.mailService.sendResetPasswordEmail(user.email, user.name, code);

      return;
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    const userId: number = await this.cacheManager.get(code);

    if (userId) {
      const user = await this.users.findOneBy({ id: userId });
      user.verified = true;
      await this.users.save(user); // verify
      await this.cacheManager.del(code); // delete verification value

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
        throw new NotFoundException('User Not Found');
      }

      const isPasswordCorrect = await user.checkPassword(password);
      delete user.password;

      if (isPasswordCorrect) {
        return { user };
      } else {
        throw new BadRequestException('Wrong Password');
      }
    } catch (e) {
      throw new HttpException(e.message, e.status);
    }
  }

  async generateRefreshToken(payload: Payload): Promise<string> {
    return await this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
      expiresIn: refreshTokenExpiration,
    });
  }
}
