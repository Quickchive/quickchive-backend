import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { TransactionInterceptor } from '../common/interceptors/transaction.interceptor';
import { TransactionManager } from '../common/transaction.decorator';
import { EntityManager } from 'typeorm';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { meOutput } from './dtos/me.dto';
import {
  ResetPasswordInput,
  ResetPasswordOutput,
} from './dtos/reset-password.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { ErrorOutput } from '../common/dtos/output.dto';

@Controller('user')
@ApiTags('User')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '프로필 수정', description: '프로필 수정 메서드' })
  @ApiCreatedResponse({
    description: '프로필 수정 성공 여부를 알려준다.',
    type: EditProfileOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(TransactionInterceptor)
  async editProfile(
    @AuthUser() user: User,
    @Body() editProfileBody: EditProfileInput,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(
      user.id,
      editProfileBody,
      queryRunnerManager,
    );
  }

  @ApiOperation({
    summary: '비밀번호 재설정',
    description: '비밀번호 재설정 메서드',
  })
  @ApiCreatedResponse({
    description: '비밀번호 재설정 성공 여부를 알려준다.',
    type: ResetPasswordOutput,
  })
  @Post('password')
  @UseInterceptors(TransactionInterceptor)
  async resetPassword(
    @Body() resetPasswordBody: ResetPasswordInput,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<ResetPasswordOutput> {
    return this.usersService.resetPassword(
      resetPasswordBody,
      queryRunnerManager,
    );
  }

  @ApiOperation({ summary: '프로필 조회', description: '프로필 조회 메서드' })
  @ApiOkResponse({
    description: '현재 유저의 정보를 반환한다.',
    type: meOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get()
  me(@AuthUser() user: User): meOutput {
    return user;
  }

  @ApiOperation({ summary: '회원탈퇴', description: '회원탈퇴 메서드' })
  @ApiOkResponse({
    description: '회원탈퇴 성공 여부를 알려준다.',
    type: DeleteAccountOutput,
  })
  @ApiNotFoundResponse({
    description: '유저가 존재하지 않는다.',
    type: ErrorOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteAccount(@AuthUser() user: User): Promise<DeleteAccountOutput> {
    return this.usersService.deleteAccount(user.id);
  }
}
