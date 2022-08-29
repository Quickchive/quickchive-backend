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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { User } from 'src/users/entities/user.entity';
import { CategoryService, ContentsService } from './contents.service';
import {
  AddCategoryBodyDto,
  AddCategoryOutput,
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
} from './dtos/category.dto';
import {
  AddContentBodyDto,
  AddContentOutput,
  AddMultipleContentsBodyDto,
  DeleteContentOutput,
  toggleFavoriteOutput,
  UpdateContentBodyDto,
  UpdateContentOutput,
} from './dtos/content.dto';

@Controller('contents')
@ApiTags('Contents')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @ApiOperation({
    summary: '콘텐츠 추가',
    description: '콘텐츠을 추가하는 메서드',
  })
  @ApiCreatedResponse({
    description: '콘텐츠 추가 성공 여부를 반환한다.',
    type: AddContentOutput,
  })
  @Post('add')
  async addContent(
    @AuthUser() user: User,
    @Body() content: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    return await this.contentsService.addContent(user, content);
  }

  @ApiOperation({
    summary: '다수의 콘텐츠 추가',
    description: `다수의 콘텐츠를 추가하는 메서드`,
  })
  @ApiCreatedResponse({
    description: '콘텐츠 추가 성공 여부를 반환한다.',
    type: AddContentOutput,
  })
  @ApiConflictResponse({
    description: '같은 카테고리 내에 동일한 링크의 콘텐츠가 존재할 경우',
  })
  @Post('addMultiple')
  async addMultipleContents(
    @AuthUser() user: User,
    @Body() contentLinks: AddMultipleContentsBodyDto,
  ): Promise<AddContentOutput> {
    return await this.contentsService.addMultipleContents(user, contentLinks);
  }

  @ApiOperation({
    summary: '콘텐츠 정보 수정',
    description: '콘텐츠을 수정하는 메서드',
  })
  @ApiCreatedResponse({
    description: '콘텐츠 수정 성공 여부를 반환한다.',
    type: UpdateContentOutput,
  })
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
  @ApiOkResponse({
    description: '즐겨찾기 등록 및 해제 성공 여부를 반환한다.',
    type: toggleFavoriteOutput,
  })
  @Patch('favorite/:contentId')
  async toggleFavorite(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<toggleFavoriteOutput> {
    return await this.contentsService.toggleFavorite(user, contentId);
  }

  @ApiOperation({
    summary: '콘텐츠 정보 삭제',
    description: '콘텐츠을 삭제하는 메서드',
  })
  @ApiOkResponse({
    description: '콘텐츠 삭제 성공 여부를 반환한다.',
    type: DeleteContentOutput,
  })
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
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({
    summary: '카테고리 추가',
    description: '카테고리를 추가하는 메서드',
  })
  @ApiCreatedResponse({
    description: '카테고리 추가 성공 여부를 반환한다.',
    type: AddCategoryOutput,
  })
  @ApiConflictResponse({
    description: '동일한 이름의 카테고리가 존재할 경우',
  })
  @Post('add')
  async addCategory(
    @AuthUser() user: User,
    @Body() { categoryName }: AddCategoryBodyDto,
  ): Promise<AddCategoryOutput> {
    return await this.categoryService.addCategory(user, categoryName);
  }

  @ApiOperation({
    summary: '카테고리 수정',
    description: '카테고리 이름을 수정하는 메서드',
  })
  @ApiCreatedResponse({
    description: '카테고리 수정 성공 여부를 반환한다.',
    type: UpdateCategoryOutput,
  })
  @Post('update')
  async updateCategory(
    @AuthUser() user: User,
    @Body() content: UpdateCategoryBodyDto,
  ): Promise<UpdateCategoryOutput> {
    return await this.categoryService.updateCategory(user, content);
  }
}
