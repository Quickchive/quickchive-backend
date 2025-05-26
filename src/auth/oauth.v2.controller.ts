import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginOutput } from './dtos/login.dto';
import { ErrorOutput } from '../common/dtos/output.dto';
import { OAuthLoginRequest } from './dtos/request/oauth-login.request.dto';
import { OAuthV2Service } from './oauth.v2.service';

@Controller('oauth/v2')
@ApiTags('oauth v2')
export class OauthV2Controller {
  constructor(private readonly oauthService: OAuthV2Service) {}

  @ApiOperation({
    summary: '카카오 로그인',
    description:
      '카카오 로그인 메서드. (회원가입이 안되어 있으면 회원가입 처리 후 로그인 처리)',
  })
  @ApiOkResponse({
    description: '로그인 성공 여부와 함께 access, refresh token을 반환한다.',
    type: LoginOutput,
  })
  @ApiBadRequestResponse({
    description:
      '카카오 로그인 요청 시 발생하는 에러를 알려준다.(ex : email 제공에 동의하지 않은 경우)',
    type: ErrorOutput,
  })
  @ApiUnauthorizedResponse({
    description: '카카오 로그인 실패 여부를 알려준다.',
    type: ErrorOutput,
  })
  @Post('kakao')
  async kakaoOauth(
    @Body() oauthRequest: OAuthLoginRequest,
  ): Promise<LoginOutput> {
    return this.oauthService.kakaoOauth(oauthRequest);
  }

  @ApiOperation({
    summary: '구글 로그인 v2',
    description:
      'id token을 사용하는 구글 로그인 메서드. (회원가입이 안되어 있으면 회원가입 처리 후 로그인 처리)',
  })
  @ApiOkResponse({
    description: '로그인 성공 여부와 함께 access, refresh token을 반환한다.',
    type: LoginOutput,
  })
  @ApiBadRequestResponse({
    description: 'code가 잘못된 경우',
    type: ErrorOutput,
  })
  @Post('google')
  async googleAuthRedirect(
    @Body() oauthRequest: OAuthLoginRequest,
  ): Promise<LoginOutput> {
    return this.oauthService.googleOauth(oauthRequest);
  }

  // @ApiOperation({
  //   summary: '애플 로그인',
  //   description:
  //     '애플 로그인 메서드. (회원가입이 안되어 있으면 회원가입 처리 후 로그인 처리)',
  // })
  // @Get('apple-login')
  // async appleLogin(
  //   @Body() oauthRequest: OAuthLoginRequest,
  // ): Promise<LoginOutput> {
  //   return this.oauthService.appleLogin(oauthRequest);
  // }
}
