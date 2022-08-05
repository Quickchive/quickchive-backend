import {
  Body,
  Controller,
  Delete,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { User } from 'src/users/entities/user.entity';
import { CategoryService, ContentsService } from './contents.service';
import {
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
} from './dtos/category.dto';
import {
  AddContentBodyDto,
  AddContentOutput,
  DeleteContentOutput,
  toggleFavoriteOutput,
  UpdateContentBodyDto,
  UpdateContentOutput,
} from './dtos/content.dto';

@Controller('contents')
@ApiTags('Contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @ApiOperation({
    summary: '아티클 추가',
    description: '아티클을 추가하는 메서드',
  })
  @ApiCreatedResponse({
    description: '아티클 추가 성공 여부를 반환한다.',
    type: AddContentOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addContent(
    @AuthUser() user: User,
    @Body() content: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    return await this.contentsService.addContent(user, content);
  }

  @ApiOperation({
    summary: '아티클 정보 수정',
    description: '아티클을 수정하는 메서드',
  })
  @ApiCreatedResponse({
    description: '아티클 수정 성공 여부를 반환한다.',
    type: UpdateContentOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Post('update')
  async updateContent(
    @AuthUser() user: User,
    @Body() content: UpdateContentBodyDto,
  ): Promise<UpdateContentOutput> {
    return await this.contentsService.updateContent(user, content);
  }

  @ApiOperation({
    summary: '즐겨찾기 등록 및 해제',
    description: '즐겨찾기에 등록 및 해제하는 메서드',
  })
  @ApiCreatedResponse({
    description: '즐겨찾기 등록 및 해제 성공 여부를 반환한다.',
    type: toggleFavoriteOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Patch('favorite/:contentId')
  async toggleFavorite(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<toggleFavoriteOutput> {
    return await this.contentsService.toggleFavorite(user, contentId);
  }

  @ApiOperation({
    summary: '아티클 정보 삭제',
    description: '아티클을 삭제하는 메서드',
  })
  @ApiCreatedResponse({
    description: '아티클 삭제 성공 여부를 반환한다.',
    type: DeleteContentOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Delete('delete/:contentId')
  async deleteContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<DeleteContentOutput> {
    return await this.contentsService.deleteContent(user, contentId);
  }
}

@Controller('category')
@ApiTags('Category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({
    summary: '카테고리 수정',
    description: '카테고리 이름을 수정하는 메서드',
  })
  @ApiCreatedResponse({
    description: '카테고리 수정 성공 여부를 반환한다.',
    type: UpdateCategoryOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Post('update')
  async updateCategory(
    @AuthUser() user: User,
    @Body() content: UpdateCategoryBodyDto,
  ): Promise<UpdateCategoryOutput> {
    return await this.categoryService.updateCategory(user, content);
  }
}
