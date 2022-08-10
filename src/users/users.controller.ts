import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoadPersonalCategoriesOutput } from './dtos/load-personal-categories.dto';
import {
  LoadFavoritesOutput,
  LoadPersonalContentsOutput,
} from './dtos/load-personal-contents.dto';
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
  async editProfile(
    @AuthUser() user: User,
    @Body() editProfileBody: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return await this.usersService.editProfile(user.id, editProfileBody);
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
  async resetPassword(
    @Body() resetPasswordBody: ResetPasswordInput,
  ): Promise<ResetPasswordOutput> {
    return await this.usersService.resetPassword(resetPasswordBody);
  }

  @ApiOperation({ summary: '프로필 조회', description: '프로필 조회 메서드' })
  @ApiCreatedResponse({
    description: '현재 유저의 정보를 반환한다.',
    type: meOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@AuthUser() user: User): meOutput {
    return user;
  }

  @ApiOperation({
    summary: '자신의 아티클 조회',
    description: '자신의 아티클을 조회하는 메서드',
  })
  @ApiQuery({
    name: 'categoryId',
    description: '카테고리 아이디(기입하지 않을 시 전체를 불러온다.)',
    type: Number,
    required: false,
  })
  @ApiCreatedResponse({
    description:
      '아티클 목록을 반환한다. 만약 categoryId가 없을 시 전부를 반환한다.',
    type: LoadPersonalContentsOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-contents')
  async loadPersonalContents(
    @AuthUser() user: User,
    @Query('categoryId') categoryId?: number,
  ): Promise<LoadPersonalContentsOutput> {
    return await this.usersService.loadPersonalContents(user, +categoryId);
  }

  @ApiOperation({
    summary: '자신의 즐겨찾기 조회',
    description: '자신의 즐겨찾기를 조회하는 메서드',
  })
  @ApiCreatedResponse({
    description: '즐겨찾기 목록을 반환한다.',
    type: LoadFavoritesOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-favorites')
  async loadFavorites(@AuthUser() user: User): Promise<LoadFavoritesOutput> {
    return await this.usersService.loadFavorites(user);
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
