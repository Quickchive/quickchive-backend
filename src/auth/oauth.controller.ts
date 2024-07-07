import {
  Controller,
  Get,
  Res,
  Query,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser } from './auth-user.decorator';
import { OAuthService } from './oauth.service';
import { googleUserInfo } from './dtos/google.dto';
import { LoginOutput } from './dtos/login.dto';
import { ErrorOutput } from '../common/dtos/output.dto';
import { KakaoLoginRequest } from './dtos/request/kakao-login.request.dto';

@Controller('oauth')
@ApiTags('OAuth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @ApiOperation({
    summary: '카카오 계정 로그인 요청',
    description: '카카오 계정 로그인 요청 메서드',
  })
  @ApiResponse({
    description: '카카오 계정 로그인 창이 켜지는 Redirect URL을 반환한다.',
    status: 302,
  })
  @Get('kakao-auth')
  async kakaoAuthorize(@Res() res: Response): Promise<void> {
    const { url } = await this.oauthService.kakaoAuthorize();
    return res.redirect(url);
  }

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
  @Get('kakao-login')
  async kakaoOauth(@Query('code') code: string): Promise<LoginOutput> {
    return this.oauthService.kakaoOauth({ code });
  }

  @ApiOperation({
    summary: '구글 계정 로그인 요청',
    description: '구글 계정 로그인 요청 메서드',
  })
  @ApiResponse({
    description: '구글 계정 로그인 창이 켜지는 Redirect URL을 반환한다.',
    status: 302,
  })
  @Get('google-auth')
  @UseGuards(AuthGuard('google'))
  googleOauth(): void {
    return;
  }

  @ApiOperation({
    summary: '구글 로그인',
    description:
      '구글 로그인 메서드. (회원가입이 안되어 있으면 회원가입 처리 후 로그인 처리)',
  })
  @ApiOkResponse({
    description: '로그인 성공 여부와 함께 access, refresh token을 반환한다.',
    type: LoginOutput,
  })
  @ApiBadRequestResponse({
    description: 'code가 잘못된 경우',
    type: ErrorOutput,
  })
  @Get('google-login')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @AuthUser() user: googleUserInfo,
  ): Promise<LoginOutput> {
    return this.oauthService.googleOauth(user);
  }

  @ApiOperation({
    summary: '애플 계정 로그인 요청',
    description: '애플 계정 로그인 요청 메서드',
  })
  @Get('apple-auth')
  async getAppleRedirectUrl(@Res() res: Response): Promise<void> {
    const { url } = await this.oauthService.getAppleRedirectUrl();
    return res.redirect(url);
  }

  @ApiOperation({
    summary: '애플 로그인 리다이렉트 후 클라이언트 리다이렉트',
  })
  @Post('apple-code')
  async appleCode(@Body('code') code: string, @Res() res: Response) {
    return res.redirect(
      `${process.env.APPLE_REDIRECT_FRONTEND_URI}?code=${code}`,
    );
  }

  @ApiOperation({
    summary: '애플 로그인',
    description:
      '애플 로그인 메서드. (회원가입이 안되어 있으면 회원가입 처리 후 로그인 처리)',
  })
  @Get('apple-login')
  async appleLogin(@Query('code') code: string): Promise<LoginOutput> {
    return this.oauthService.appleLogin(code);
  }

  @ApiOperation({
    summary: '카카오 로그인 요청',
    description: 'accessToken을 받아 카카오 로그인을 요청합니다.',
  })
  @Post('kakao')
  async createOneWithKakao(@Body() kakaoLoginRequest: KakaoLoginRequest) {
    return this.oauthService.createOneWithKakao(kakaoLoginRequest);
  }
}
