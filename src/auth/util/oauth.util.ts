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

@Injectable()
export class OAuthUtil {
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
      throw e;
    }
  }
}
