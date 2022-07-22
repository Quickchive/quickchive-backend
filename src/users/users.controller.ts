import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { LoadPersonalContentsOutput } from './dtos/load-personal-contents.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('User')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    type: LoadPersonalContentsOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-categories')
  async loadPersonalCategories(
    @AuthUser() user: User,
  ): Promise<LoadPersonalContentsOutput> {
    return await this.usersService.loadPersonalCategories(user);
  }
}
