import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { refreshTokenExpirationInCache } from './auth.module';
import { googleUserInfo } from './dtos/google.dto';
import { KakaoAuthorizeOutput, LoginWithKakaoDto } from './dtos/kakao.dto';
import { LoginOutput } from './dtos/login.dto';
import { Payload } from './jwt/jwt.payload';
import { customJwtService } from './jwt/jwt.service';
import { OAuthUtil } from './util/oauth.util';
import { CategoryRepository } from '../categories/category.repository';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/repository/user.repository';
import * as CryptoJS from 'crypto-js';
import { CookieOptions } from 'express';
import { RedisService } from '../infra/redis/redis.service';
import { REFRESH_TOKEN_KEY } from './constants';
import { KakaoLoginRequest } from './dtos/request/kakao-login.request.dto';
import { KakaoLoginDto } from './dtos/kakao-login.dto';
import { PROVIDER } from '../users/constant/provider.constant';

@Injectable()
export class OAuthService {
  constructor(
    private readonly jwtService: customJwtService,
    private readonly userRepository: UserRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly oauthUtil: OAuthUtil,
    private readonly redisService: RedisService,
  ) {}

  // OAuth Login
  async oauthLogin(email: string, provider: PROVIDER): Promise<LoginOutput> {
    try {
      const user: User = await this.userRepository.findOneByOrFail({
        email,
        provider,
      });
      if (user) {
        const payload: Payload = this.jwtService.createPayload(
          user.email,
          true,
          user.id,
        );
        const refreshToken = this.jwtService.generateRefreshToken(payload);
        await this.redisService.set(
          `${REFRESH_TOKEN_KEY}:${user.id}`,
          refreshToken,
          refreshTokenExpirationInCache,
        );

        return {
          access_token: this.jwtService.sign(payload),
          refresh_token: refreshToken,
        };
      } else {
        throw new UnauthorizedException('Error in OAuth login');
      }
    } catch (e) {
      throw e;
    }
  }

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
      throw e;
    }
  }

  /*
   * Get user info from Kakao Auth Server then create account,
   * login and return access token and refresh token
   */
  async kakaoOauth({ code }: LoginWithKakaoDto): Promise<LoginOutput> {
    try {
      const { access_token } = await this.oauthUtil.getKakaoAccessToken(code);

      const { userInfo } = await this.oauthUtil.getKakaoUserInfo(access_token);

      const email = userInfo.kakao_account.email;
      if (!email) {
        throw new BadRequestException('Please Agree to share your email');
      }

      const user = await this.userRepository.findOneByEmailAndProvider(
        email,
        PROVIDER.KAKAO,
      );
      if (user) {
        return this.oauthLogin(user.email, PROVIDER.KAKAO);
      }

      // 회원가입인 경우 기본 카테고리 생성 작업 진행
      const newUser = User.of({
        email,
        name: userInfo.kakao_account.profile.nickname,
        profileImage: userInfo.kakao_account.profile?.profile_image_url,
        password: this.encodePasswordFromEmail(email, process.env.KAKAO_JS_KEY),
        provider: PROVIDER.KAKAO,
      });

      await this.userRepository.createOne(newUser);
      await this.categoryRepository.createDefaultCategories(newUser);

      return this.oauthLogin(newUser.email, PROVIDER.KAKAO);
    } catch (e) {
      throw e;
    }
  }

  // Login with Google account info
  async googleOauth({
    email,
    name,
    picture,
  }: googleUserInfo): Promise<LoginOutput> {
    const user = await this.userRepository.findOneByEmailAndProvider(
      email,
      PROVIDER.GOOGLE,
    );

    if (user) {
      return this.oauthLogin(user.email, PROVIDER.GOOGLE);
    }

    // 회원가입인 경우 기본 카테고리 생성 작업 진행
    const newUser = User.of({
      email,
      name,
      profileImage: picture,
      password: this.encodePasswordFromEmail(
        email,
        process.env.GOOGLE_CLIENT_ID,
      ),
      provider: PROVIDER.GOOGLE,
    });

    await this.userRepository.createOne(newUser);
    await this.categoryRepository.createDefaultCategories(newUser);

    return this.oauthLogin(newUser.email, PROVIDER.GOOGLE);
  }

  private encodePasswordFromEmail(email: string, key?: string): string {
    return CryptoJS.SHA256(email + key).toString();
  }

  public getCookieOption(): CookieOptions {
    return {
      domain: process.env.FRONTEND_DOMAIN,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    };
  }

  public async getAppleRedirectUrl() {
    const appleClientId = process.env.APPLE_CLIENT_ID;
    const redirectUri = process.env.APPLE_REDIRECT_URI;

    const config = {
      client_id: appleClientId, // This is the service ID we created.
      redirect_uri: redirectUri, // As registered along with our service ID
      response_type: 'code id_token',
      state: 'origin:web', // Any string of your choice that you may use for some logic. It's optional and you may omit it.
      scope: 'name email', // To tell apple we want the user name and emails fields in the response it sends us.
      response_mode: 'form_post',
      m: 11,
      v: '1.5.4',
    };
    const queryString = Object.entries(config)
      .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
      .join('&');

    return { url: `https://appleid.apple.com/auth/authorize?${queryString}` };
  }

  public async appleLogin(code: string) {
    const data = await this.oauthUtil.getAppleToken(code);

    if (!data.id_token) {
      throw new InternalServerErrorException(
        `No token: ${JSON.stringify(data)}`,
      );
    }

    const { sub: id, email } = this.jwtService.decode(data.id_token);

    const user = await this.userRepository.findOneByEmailAndProvider(
      email,
      PROVIDER.APPLE,
    );

    if (user) {
      return this.oauthLogin(user.email, PROVIDER.APPLE);
    }

    const newUser = User.of({
      email,
      name: email.split('@')[0],
      password: this.encodePasswordFromEmail(
        email,
        process.env.APPLE_CLIENT_ID,
      ),
      provider: PROVIDER.APPLE,
    });

    await this.userRepository.createOne(newUser);
    await this.categoryRepository.createDefaultCategories(newUser);

    return this.oauthLogin(newUser.email, PROVIDER.APPLE);
  }
}
