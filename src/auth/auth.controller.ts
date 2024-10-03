import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorOutput } from '../common/dtos/output.dto';
import { User } from '../domain/user/entities/user.entity';
import { AuthUser } from './auth-user.decorator';
import { AuthService } from './auth.service';
import {
  LoginBodyDto,
  LoginOutput,
  LogoutBodyDto,
  LogoutOutput,
} from './dtos/login.dto';
import { sendPasswordResetEmailOutput } from './dtos/send-password-reset-email.dto';
import { RefreshTokenDto, RefreshTokenOutput } from './dtos/token.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '로그인', description: '로그인 메서드' })
  @ApiCreatedResponse({
    description: '로그인 성공 여부와 함께 access, refresh token을 반환한다.',
    type: LoginOutput,
  })
  @ApiBadRequestResponse({
    description: '잘못된 파라미터로 요청 시 반환되는 응답',
    type: ErrorOutput,
  })
  @ApiNotFoundResponse({
    description: '해당 이메일의 유저가 존재하지 않는다.',
    type: ErrorOutput,
  })
  @Post('login')
  async login(@Body() loginBody: LoginBodyDto): Promise<LoginOutput> {
    return this.authService.jwtLogin(loginBody);
  }

  @ApiOperation({ summary: '로그아웃', description: '로그아웃 메서드' })
  @ApiCreatedResponse({
    description: '로그아웃 성공 여부를 알려준다.',
    type: LogoutOutput,
  })
  @ApiNotFoundResponse({
    description: '유저가 존재하지 않거나 refresh token이 DB에 존재하지 않는다.',
    type: ErrorOutput,
  })
  @ApiBadRequestResponse({
    description: 'Refresh token이 잘못되었다.',
    type: ErrorOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @AuthUser() user: User,
    @Body() logoutBody: LogoutBodyDto,
  ): Promise<LogoutOutput> {
    return this.authService.logout(user.id, logoutBody);
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
    type: ErrorOutput,
  })
  @ApiUnauthorizedResponse({
    description: 'refresh token이 유효하지 않다.',
    type: ErrorOutput,
  })
  @Post('token')
  async reissueToken(
    @Body() regenerateBody: RefreshTokenDto,
  ): Promise<RefreshTokenOutput> {
    return this.authService.reissueToken(regenerateBody);
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
    type: ErrorOutput,
  })
  @ApiUnauthorizedResponse({
    description: '이메일이 인증되지 않은 경우에 응답한다.',
    type: ErrorOutput,
  })
  @Post('send-password-reset-email/:email')
  async sendPasswordResetEmail(
    @Param('email') email: string,
  ): Promise<sendPasswordResetEmailOutput> {
    return this.authService.sendPasswordResetEmail(email);
  }
}
