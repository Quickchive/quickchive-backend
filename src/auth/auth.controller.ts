import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { AuthUser } from './auth-user.decorator';
import { AuthService } from './auth.service';
import {
  CreateAccountBodyDto,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { LoginBodyDto, LoginOutput, LogoutOutput } from './dtos/login.dto';
import { RefreshTokenDto, RefreshTokenOutput } from './dtos/token.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createAccountBody: CreateAccountBodyDto,
  ): Promise<CreateAccountOutput> {
    return await this.authService.register(createAccountBody);
  }

  @Post('login')
  async login(@Body() loginBody: LoginBodyDto): Promise<LoginOutput> {
    return await this.authService.jwtLogin(loginBody);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logout(@AuthUser() user: User): Promise<LogoutOutput> {
    return await this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteAccount(@AuthUser() user: User): Promise<DeleteAccountOutput> {
    return await this.authService.deleteAccount(user.id);
  }

  @Post('reissue')
  async regenerateToken(
    @Body() regenerateBody: RefreshTokenDto,
  ): Promise<RefreshTokenOutput> {
    return await this.authService.regenerateToken(regenerateBody);
  }

  @Get('verify-email')
  async verifyEmail(@Query('code') code: string): Promise<VerifyEmailOutput> {
    return await this.authService.verifyEmail(code);
  }
}
