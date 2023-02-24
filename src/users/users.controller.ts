import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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

@Controller('users')
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
  @Post('edit')
  @UseInterceptors(TransactionInterceptor)
  async editProfile(
    @AuthUser() user: User,
    @Body() editProfileBody: EditProfileInput,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<EditProfileOutput> {
    return await this.usersService.editProfile(
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
  @Post('reset-password')
  @UseInterceptors(TransactionInterceptor)
  async resetPassword(
    @Body() resetPasswordBody: ResetPasswordInput,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<ResetPasswordOutput> {
    return await this.usersService.resetPassword(
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
  @Get('me')
  me(@AuthUser() user: User): meOutput {
    return user;
  }

  // @ApiOperation({
  //   summary: '자신의 콜렉션 조회',
  //   description: '자신의 콜렉션을 조회하는 메서드',
  // })
  // @ApiQuery({
  //   name: 'categoryId',
  //   description: `카테고리 아이디 만약 categoryId가 없을 시 전부를 반환한다.`,
  //   type: Number,
  //   required: false,
  // })
  // @ApiOkResponse({
  //   description:
  //     '콜렉션 목록을 반환한다. 만약 categoryId가 없을 시 전부를 반환한다.',
  //   type: LoadPersonalCollectionsOutput,
  // })
  // @ApiBearerAuth('Authorization')
  // @UseGuards(JwtAuthGuard)
  // @Get('load-collections')
  // async loadPersonalCollections(
  //   @AuthUser() user: User,
  //   @Query('categoryId') categoryId: number,
  // ): Promise<LoadPersonalCollectionsOutput> {
  //   return await this.usersService.loadPersonalCollections(user, +categoryId);
  // }
}
