import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { AuthUser } from './auth-user.decorator';
import { AuthService, OauthService } from './auth.service';
import {
  CreateAccountBodyDto,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { KakaoAuthorizeOutput, LoginWithKakaoDto } from './dtos/kakao.dto';
import {
  LoginBodyDto,
  LoginOutput,
  LogoutBodyDto,
  LogoutOutput,
} from './dtos/login.dto';
import { sendPasswordResetEmailOutput } from './dtos/send-password-reset-email.dto';
import { RefreshTokenDto, RefreshTokenOutput } from './dtos/token.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입', description: '회원가입 메서드' })
  @ApiCreatedResponse({
    description: '회원가입 성공 여부를 알려준다.',
    type: CreateAccountOutput,
  })
  @ApiNotFoundResponse({
    description: '메일 인증된 유저가 존재하지 않는다.',
  })
  @Post('register')
  async register(
    @Body() createAccountBody: CreateAccountBodyDto,
  ): Promise<CreateAccountOutput> {
    return await this.authService.register(createAccountBody);
  }

  @ApiOperation({ summary: '로그인', description: '로그인 메서드' })
  @ApiCreatedResponse({
    description: '로그인 성공 여부와 함께 access, refresh token을 반환한다.',
    type: LoginOutput,
  })
  @ApiBadRequestResponse({
    description: '잘못된 파라미터로 요청 시 반환되는 응답',
  })
  @ApiNotFoundResponse({
    description: '해당 이메일의 유저가 존재하지 않는다.',
  })
  @Post('login')
  async login(@Body() loginBody: LoginBodyDto): Promise<LoginOutput> {
    return await this.authService.jwtLogin(loginBody);
  }

  @ApiOperation({ summary: '로그아웃', description: '로그아웃 메서드' })
  @ApiCreatedResponse({
    description: '로그아웃 성공 여부를 알려준다.',
    type: LogoutOutput,
  })
  @ApiNotFoundResponse({
    description: '유저가 존재하지 않거나 refresh token이 DB에 존재하지 않는다.',
  })
  @ApiBadRequestResponse({
    description: 'Refresh token이 잘못되었다.',
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @AuthUser() user: User,
    @Body() logoutBody: LogoutBodyDto,
  ): Promise<LogoutOutput> {
    return await this.authService.logout(user.id, logoutBody);
  }

  @ApiOperation({ summary: '회원탈퇴', description: '회원탈퇴 메서드' })
  @ApiOkResponse({
    description: '회원탈퇴 성공 여부를 알려준다.',
    type: DeleteAccountOutput,
  })
  @ApiNotFoundResponse({
    description: '유저가 존재하지 않는다.',
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteAccount(@AuthUser() user: User): Promise<DeleteAccountOutput> {
    return await this.authService.deleteAccount(user.id);
  }

  @ApiOperation({
    summary: '토큰 재발행',
    description: 'access, refresh 토큰을 재발행',
  })
  @ApiCreatedResponse({
    description: '재발행된 토큰들을 반환한다.',
    type: RefreshTokenOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 refresh token이므로 재발행할 수 없다.',
  })
  @Post('reissue')
  async reissueToken(
    @Body() regenerateBody: RefreshTokenDto,
  ): Promise<RefreshTokenOutput> {
    return await this.authService.reissueToken(regenerateBody);
  }

  @ApiOperation({
    summary: '새 유저 인증을 위한 메일 전송',
    description: '유저 인증 메일 전송 메서드',
  })
  @ApiOkResponse({
    description: '새 유저 인증을 위한 메일 전송 성공 여부를 알려준다.',
    type: VerifyEmailOutput,
  })
  @ApiConflictResponse({
    description:
      '해당 이메일이 이미 인증됐다고 알려준다.(이미 회원가입이 된 경우와 메일만 인증된 경우가 존재한다.)',
  })
  @Get('send-verify-email/:email')
  async sendVerifyEmail(
    @Param('email') email: string,
  ): Promise<VerifyEmailOutput> {
    return await this.authService.sendVerifyEmail(email);
  }

  @ApiOperation({
    summary: '비밀번호 재설정을 위한 메일 전송',
    description: '비밀번호 재설정 메서드',
  })
  @ApiOkResponse({
    description: '비밀번호 재설정을 위한 메일 전송 성공 여부를 알려준다.',
    type: sendPasswordResetEmailOutput,
  })
  @ApiNotFoundResponse({
    description: '유저가 존재하지 않음을 알려준다.',
  })
  @Get('send-password-reset-email/:email')
  async sendPasswordResetEmail(
    @Param('email') email: string,
  ): Promise<sendPasswordResetEmailOutput> {
    return await this.authService.sendPasswordResetEmail(email);
  }

  @ApiOperation({
    summary: '이메일 인증',
    description: '이메일 인증 메서드',
  })
  @ApiOkResponse({
    description: '이메일 인증 성공 여부를 알려준다.',
    type: VerifyEmailOutput,
  })
  @ApiNotFoundResponse({
    description: '이메일 인증 코드가 존재하지 않음을 알려준다.',
  })
  @Get('verify-email')
  async verifyEmail(@Query('code') code: string): Promise<VerifyEmailOutput> {
    return await this.authService.verifyEmail(code);
  }
}

@Controller('oauth')
@ApiTags('OAuth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @ApiOperation({
    summary: '카카오 계정 로그인 요청',
    description: '카카오 계정 로그인 요청 메서드',
  })
  @ApiOkResponse({
    description: '카카오 계정 로그인 URL을 반환한다.',
    type: KakaoAuthorizeOutput,
  })
  @Get('kakao-auth')
  async kakaoAuthorize(): Promise<KakaoAuthorizeOutput> {
    return await this.oauthService.kakaoAuthorize();
  }

  @ApiOperation({
    summary: '카카오 로그인',
    description:
      '카카오 로그인 메서드. (회원가입이 안되어 있으면 회원가입 처리 후 로그인 처리)',
  })
  @ApiCreatedResponse({
    description: '로그인 성공 여부와 함께 access, refresh token을 반환한다.',
    type: LoginOutput,
  })
  @ApiUnauthorizedResponse({
    description: '카카오 로그인 실패 여부를 알려준다.',
    type: LoginOutput,
  })
  @Post('kakao-login')
  async kakaoOauth(
    @Body() loginWithKakaoBody: LoginWithKakaoDto,
  ): Promise<LoginOutput> {
    return await this.oauthService.kakaoOauth(loginWithKakaoBody);
  }
}
