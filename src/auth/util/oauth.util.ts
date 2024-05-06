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

@Injectable()
export class OAuthUtil {
  constructor(private readonly jwtService: JwtService) {}

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

  getAppleAccessToken(): string {
    const timeNow = Math.floor(Date.now() / 1000);

    const claims = {
      iss: process.env.APPLE_TEAM_ID,
      iat: timeNow,
      aud: 'https://appleid.apple.com',
      sub: process.env.APPLE_CLIENT_ID,
    };

    const privateKey = process.env
      .APPLE_SECRET_KEY!.split(String.raw`\n`)
      .join('\n');
    console.log(privateKey);

    return this.jwtService.sign(claims, {
      keyid: process.env.APPLE_KEY_ID,
      expiresIn: timeNow + 300,
      privateKey,
      algorithm: 'ES256',
    });
  }

  async getAppleToken(code: string) {
    return await axios.post(
      'https://appleid.apple.com/auth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_secret: this.getAppleAccessToken(),
        client_id: process.env.APPLE_CLIENT_ID,
        redirect_uri: process.env.APPLE_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
  }
}
