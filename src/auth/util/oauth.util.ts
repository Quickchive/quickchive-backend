import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';
import {
  GetKakaoAccessTokenOutput,
  GetKakaoUserInfoOutput,
} from '../dtos/kakao.dto';
import { JwtService } from '@nestjs/jwt';
import appleSignin from 'apple-signin-auth';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuthUtil {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly APPLE_CLIENT_ID = this.configService.get('APPLE_CLIENT_ID');
  private readonly APPLE_TEAM_ID = this.configService.get('APPLE_TEAM_ID');
  private readonly APPLE_PRIVATE_KEY = String(
    this.configService.get('APPLE_SECRET_KEY'),
  )
    .split(String.raw`'\n`)
    .join('\n');
  private readonly APPLE_KEY_ID = this.configService.get('APPLE_KEY_ID');
  private readonly APPLE_REDIRECT_URI =
    this.configService.get('APPLE_REDIRECT_URI');

  // Get access token from Kakao Auth Server
  async getKakaoAccessToken(code: string): Promise<GetKakaoAccessTokenOutput> {
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
      throw e;
    }
  }

  // Get User Info from Kakao Auth Server
  async getKakaoUserInfo(
    access_token: string,
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
      throw e;
    }
  }

  async getAppleToken(code: string) {
    const clientSecret = appleSignin.getClientSecret({
      clientID: this.APPLE_CLIENT_ID,
      teamID: this.APPLE_TEAM_ID,
      privateKey: this.APPLE_PRIVATE_KEY,
      keyIdentifier: this.APPLE_KEY_ID,
      expAfter: 300,
    });

    return await appleSignin.getAuthorizationToken(code, {
      clientID: this.APPLE_CLIENT_ID,
      redirectUri: this.APPLE_REDIRECT_URI,
      clientSecret,
    });
  }
}
