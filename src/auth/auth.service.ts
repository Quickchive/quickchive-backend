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
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  refreshTokenExpirationInCache,
  refreshTokenExpirationInCacheShortVersion,
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
import { ONEMONTH, Payload } from './jwt/jwt.payload';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import * as qs from 'qs';
import {
  CreateKakaoAccountBodyDto,
  CreateKakaoAccountOutput,
  GetKakaoAccessTokenOutput,
  GetKakaoUserInfoOutput,
  KakaoAuthorizeOutput,
  LoginWithKakaoDto,
} from './dtos/kakao.dto';
import { googleUserInfo } from './dtos/google.dto';
import { customJwtService } from './jwt/jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: customJwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
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
      throw new HttpException(e.message, e.status ? e.status : 500);
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
      throw new HttpException(e.message, e.status ? e.status : 500);
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
    let decoded: Payload = null;
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

    const user = await this.users.findOneBy({ id: decoded.sub });
    const auto_login: boolean = decoded.period === ONEMONTH;

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

  async sendVerifyEmail(email: string): Promise<VerifyEmailOutput> {
    const user = await this.users.findOneBy({ email });
    let newUser: User = null;
    if (user && user.verified === true) {
      if (!user.name) {
        throw new ConflictException(
          'User is already verified now please register',
        );
      } else {
        throw new ConflictException('User already exist with this email');
      }
    } else if (user && user.verified === false) {
      newUser = user;
    } else {
      newUser = await this.users.save(
        this.users.create({
          email,
          password: 'unverified0',
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

      return { email: user.email };
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
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }
}

@Injectable()
export class OauthService {
  constructor(
    private readonly jwtService: customJwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /*
   * Kakao Auth methods
   */

  // Get access token from Kakao Auth Server
  async getKakaoAccessToken(code: string): Promise<GetKakaoAccessTokenOutput> {
    console.log(code);
    try {
      const formData = {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI_LOGIN,
        code,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
      };
      const {
        data: { access_token },
      } = await axios
        .post(`https://kauth.kakao.com/oauth/token?${qs.stringify(formData)}`)
        .then((res) => {
          return res;
        })
        .catch((e) => {
          console.log(e.response.data);
          if (e.response.data.error_description) {
            throw new UnauthorizedException(e.response.data.error_description);
          } else {
            throw new BadRequestException(e.message);
          }
        });

      return { access_token };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  // Get User Info from Kakao Auth Server
  async getKakaoUserInfo(
    access_token: String,
  ): Promise<GetKakaoUserInfoOutput> {
    try {
      const { data: userInfo } = await axios
        .get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: 'Bearer ' + access_token,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        })
        .then((res) => {
          return res;
        })
        .catch((e) => {
          throw new BadRequestException(e.message);
        });

      return { userInfo };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  // Create Account By Kakao User Info
  async createKakaoAccount(
    userInfo: CreateKakaoAccountBodyDto,
  ): Promise<CreateKakaoAccountOutput> {
    try {
      const userInDb = await this.users.findOneBy({ email: userInfo.email });
      if (userInDb) {
        return { user: userInDb };
      } else {
        const newUser = await this.users.save(
          this.users.create({
            email: userInfo.email,
            name: userInfo.name,
            password: userInfo.password,
            verified: true,
          }),
        );
        return { user: newUser };
      }
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 400);
    }
  }

  /*
   * end of Kakao Auth methods
   */

  async kakaoAuthorize(): Promise<KakaoAuthorizeOutput> {
    try {
      const kakaoAuthorizeUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${process.env.KAKAO_REDIRECT_URI_LOGIN}&response_type=code`;
      const {
        request: {
          res: { responseUrl },
        },
      } = await axios
        .get(kakaoAuthorizeUrl)
        .then((res) => {
          return res;
        })
        .catch((e) => {
          throw new BadRequestException(e.message);
        });
      return { url: responseUrl };
    } catch (e) {
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  // OAuth Login
  async oauthLogin(email: string): Promise<LoginOutput> {
    try {
      const user: User = await this.users.findOneBy({ email });
      if (user) {
        const payload: Payload = this.jwtService.createPayload(
          user.email,
          true,
          user.id,
        );
        const refreshToken = await this.jwtService.generateRefreshToken(
          payload,
        );
        await this.cacheManager.set(refreshToken, user.id, {
          ttl: refreshTokenExpirationInCache,
        });

        return {
          access_token: this.jwtService.sign(payload),
          refresh_token: refreshToken,
        };
      } else {
        throw new UnauthorizedException('Error in OAuth login');
      }
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /*
   * Get user info from Kakao Auth Server then create account,
   * login and return access token and refresh token
   */
  async kakaoOauth({ code }: LoginWithKakaoDto): Promise<LoginOutput> {
    try {
      const { access_token, error: accessTokenError } =
        await this.getKakaoAccessToken(code);
      if (accessTokenError) {
        console.log(accessTokenError);
        return { error: 'Please go back and Try again' };
      }

      const { userInfo, error: userInfoError } = await this.getKakaoUserInfo(
        access_token,
      );
      if (userInfoError) {
        console.log(userInfoError);
        return { error: 'Please go back and Try again' };
      }

      const email = userInfo.kakao_account.email;

      // check user exist with email
      const userInDb = await this.users.findOne({
        where: { email },
        select: { id: true, email: true, password: true },
      });

      // control user
      let createAccountResult = null;
      if (!userInDb) {
        const name = userInfo.properties.nickname;
        const password = CryptoJS.SHA256(
          email + process.env.KAKAO_JS_KEY,
        ).toString();
        const { user } = await this.createKakaoAccount({
          name,
          email,
          password,
        });
        createAccountResult = user;
      } else if (userInDb) {
        return await this.oauthLogin(userInDb.email);
      } else if (createAccountResult) {
        return await this.oauthLogin(email);
      } else {
        throw new BadRequestException("Couldn't log in with Kakao");
      }
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }

  // Login with Google account info
  async googleOauth({ email, name }: googleUserInfo): Promise<LoginOutput> {
    try {
      // check user exist with email
      const userInDb = await this.users.findOne({
        where: { email },
        select: { id: true, email: true, password: true },
      });

      // control user
      let createAccountResult = null;
      if (!userInDb) {
        const password = CryptoJS.SHA256(
          email + process.env.GOOGLE_CLIENT_ID,
        ).toString();
        const { user } = await this.createKakaoAccount({
          name,
          email,
          password,
        });
        createAccountResult = user;
      } else if (userInDb) {
        return await this.oauthLogin(userInDb.email);
      } else if (createAccountResult) {
        return await this.oauthLogin(email);
      } else {
        throw new BadRequestException("Couldn't log in with Google");
      }
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, e.status ? e.status : 500);
    }
  }
}
