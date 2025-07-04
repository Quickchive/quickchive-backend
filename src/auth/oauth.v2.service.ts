import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginOutput } from './dtos/login.dto';
import { PROVIDER } from '../users/constant/provider.constant';
import { User } from '../users/entities/user.entity';
import { OAuthUtil } from './util/oauth.util';
import { UserRepository } from '../users/repository/user.repository';
import { Payload } from './jwt/jwt.payload';
import { REFRESH_TOKEN_KEY } from './constants';
import { refreshTokenExpirationInCache } from './auth.module';
import { customJwtService } from './jwt/jwt.service';
import { RedisService } from '../infra/redis/redis.service';
import * as CryptoJS from 'crypto-js';
import { CategoryRepository } from '../categories/category.repository';
import { OAuthLoginRequest } from './dtos/request/oauth-login.request.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuthV2Service {
  private readonly googleClient = new OAuth2Client(
    this.configService.get('GOOGLE_SECRET'),
  );

  constructor(
    private readonly jwtService: customJwtService,
    private readonly userRepository: UserRepository,
    private readonly oauthUtil: OAuthUtil,
    private readonly categoryRepository: CategoryRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
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

  /*
   * Get user info from Kakao Auth Server then create account,
   * login and return access token and refresh token
   */
  async kakaoOauth({
    authorizationToken,
  }: OAuthLoginRequest): Promise<LoginOutput> {
    try {
      const { userInfo } = await this.oauthUtil.getKakaoUserInfo(
        authorizationToken,
      );

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
  // @todo 액세스 토큰 파싱하는 부분 추상화
  async googleOauth({
    authorizationToken,
  }: OAuthLoginRequest): Promise<LoginOutput> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: authorizationToken,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.name || !payload.email) {
      throw new BadRequestException('Invalid google payload');
    }

    const user = await this.userRepository.findOneByEmailAndProvider(
      payload.email,
      PROVIDER.GOOGLE,
    );

    if (user) {
      return this.oauthLogin(user.email, PROVIDER.GOOGLE);
    }

    // 회원가입인 경우 기본 카테고리 생성 작업 진행
    const newUser = User.of({
      email: payload.email,
      name: payload.name,
      profileImage: payload.picture,
      password: this.encodePasswordFromEmail(
        payload.email,
        process.env.GOOGLE_CLIENT_ID,
      ),
      provider: PROVIDER.GOOGLE,
    });

    await this.userRepository.createOne(newUser);
    await this.categoryRepository.createDefaultCategories(newUser);

    return this.oauthLogin(newUser.email, PROVIDER.GOOGLE);
  }

  public async appleLogin({ authorizationToken }: OAuthLoginRequest) {
    const { sub: id, email } = this.jwtService.decode(authorizationToken);

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

  private encodePasswordFromEmail(email: string, key?: string): string {
    return CryptoJS.SHA256(email + key).toString();
  }
}
