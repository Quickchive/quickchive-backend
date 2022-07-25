import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoadPersonalCategoriesOutput } from './dtos/load-personal-categories.dto';
import { LoadPersonalContentsOutput } from './dtos/load-personal-contents.dto';
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
  async editProfile(
    @AuthUser() user: User,
    @Body() editProfileBody: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return await this.usersService.editProfile(user.id, editProfileBody);
  }

  @ApiOperation({ summary: '프로필 조회', description: '프로필 조회 메서드' })
  @ApiCreatedResponse({
    description: '현재 유저의 정보를 반환한다.',
    type: User,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@AuthUser() user: User): User {
    return user;
  }

  @ApiOperation({
    summary: '자신의 아티클 조회',
    description: '자신의 아티클을 조회하는 메서드',
  })
  @ApiCreatedResponse({
    description: '아티클 목록을 반환한다.',
    type: LoadPersonalContentsOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-contents')
  async loadPersonalContents(
    @AuthUser() user: User,
  ): Promise<LoadPersonalContentsOutput> {
    return await this.usersService.loadPersonalContents(user);
  }

  @ApiOperation({
    summary: '자신의 카테고리 목록 조회',
    description: '자신의 카테고리 목록을 조회하는 메서드',
  })
  @ApiCreatedResponse({
    description: '카테고리 목록을 반환한다.',
    type: LoadPersonalCategoriesOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-categories')
  async loadPersonalCategories(
    @AuthUser() user: User,
  ): Promise<LoadPersonalCategoriesOutput> {
    return await this.usersService.loadPersonalCategories(user);
  }
}
