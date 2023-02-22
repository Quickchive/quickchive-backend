import {
  Body,
  Controller,
  Delete,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  Patch,
  Get,
  UseInterceptors,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { TransactionInterceptor } from '../common/interceptors/transaction.interceptor';
import { TransactionManager } from '../common/transaction.decorator';
import { User } from '../users/entities/user.entity';
import { EntityManager } from 'typeorm';
import { CategoryService, ContentsService } from './contents.service';
import {
  AddCategoryBodyDto,
  AddCategoryOutput,
  DeleteCategoryOutput,
  UpdateCategoryBodyDto,
  UpdateCategoryOutput,
} from './dtos/category.dto';
import {
  AddContentBodyDto,
  AddContentOutput,
  AddMultipleContentsBodyDto,
  checkReadFlagOutput,
  DeleteContentOutput,
  SummarizeContentBodyDto,
  SummarizeContentOutput,
  toggleFavoriteOutput,
  UpdateContentBodyDto,
  UpdateContentOutput,
} from './dtos/content.dto';
import {
  LoadPersonalCategoriesOutput,
  LoadRecentCategoriesOutput,
} from './dtos/load-personal-categories.dto';
import { ErrorOutput } from '../common/dtos/output.dto';
import {
  LoadFavoritesOutput,
  LoadPersonalContentsOutput,
} from './dtos/load-personal-contents.dto';

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
  @ApiConflictResponse({
    description: '같은 카테고리 내에 동일한 링크의 콘텐츠가 존재할 경우',
    type: ErrorOutput,
  })
  @Post('add')
  @UseInterceptors(TransactionInterceptor)
  async addContent(
    @AuthUser() user: User,
    @Body() content: AddContentBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    return await this.contentsService.addContent(
      user,
      content,
      queryRunnerManager,
    );
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
    type: ErrorOutput,
  })
  @Post('addMultiple')
  @UseInterceptors(TransactionInterceptor)
  async addMultipleContents(
    @AuthUser() user: User,
    @Body() contentLinks: AddMultipleContentsBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<AddContentOutput> {
    return await this.contentsService.addMultipleContents(
      user,
      contentLinks,
      queryRunnerManager,
    );
  }

  @ApiOperation({
    summary: '콘텐츠 정보 수정',
    description: '콘텐츠을 수정하는 메서드',
  })
  @ApiCreatedResponse({
    description: '콘텐츠 수정 성공 여부를 반환한다.',
    type: UpdateContentOutput,
  })
  @ApiConflictResponse({
    description: '동일한 링크의 콘텐츠가 같은 카테고리 내에 존재할 경우',
    type: ErrorOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 콘텐츠 또는 유저인 경우',
    type: ErrorOutput,
  })
  @Post('update')
  @UseInterceptors(TransactionInterceptor)
  async updateContent(
    @AuthUser() user: User,
    @Body() content: UpdateContentBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<UpdateContentOutput> {
    return await this.contentsService.updateContent(
      user,
      content,
      queryRunnerManager,
    );
  }

  @ApiOperation({
    summary: '즐겨찾기 등록 및 해제',
    description: '즐겨찾기에 등록 및 해제하는 메서드',
  })
  @ApiOkResponse({
    description: '즐겨찾기 등록 및 해제 성공 여부를 반환한다.',
    type: toggleFavoriteOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 콘텐츠 또는 유저인 경우',
    type: ErrorOutput,
  })
  @Patch('favorite/:contentId')
  @UseInterceptors(TransactionInterceptor)
  async toggleFavorite(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<toggleFavoriteOutput> {
    return await this.contentsService.toggleFavorite(
      user,
      contentId,
      queryRunnerManager,
    );
  }

  @ApiOperation({
    summary: '읽었음 표시',
    description: '읽었음 표시를 하는 메서드',
  })
  @ApiOkResponse({
    description: '읽었음 표시 성공 여부를 반환한다.',
    type: checkReadFlagOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 콘텐츠 또는 유저인 경우',
    type: ErrorOutput,
  })
  @Patch('read/:contentId')
  async readContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<checkReadFlagOutput> {
    return await this.contentsService.readContent(user, contentId);
  }

  @ApiOperation({
    summary: '콘텐츠 삭제',
    description: '콘텐츠을 삭제하는 메서드',
  })
  @ApiOkResponse({
    description: '콘텐츠 삭제 성공 여부를 반환한다.',
    type: DeleteContentOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 콘텐츠 또는 유저인 경우',
    type: ErrorOutput,
  })
  @Delete('delete/:contentId')
  @UseInterceptors(TransactionInterceptor)
  async deleteContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<DeleteContentOutput> {
    return await this.contentsService.deleteContent(
      user,
      contentId,
      queryRunnerManager,
    );
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
  @ApiOkResponse({
    description: `아티클 목록을 반환한다. 만약 categoryId가 없을 시 전부를 반환한다.`,
    type: LoadPersonalContentsOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-contents')
  async loadPersonalContents(
    @AuthUser() user: User,
    @Query('categoryId') categoryId?: number,
  ): Promise<LoadPersonalContentsOutput> {
    if (categoryId) categoryId = +categoryId;
    return await this.contentsService.loadPersonalContents(user, categoryId);
  }

  @ApiOperation({
    summary: '자신의 즐겨찾기 조회',
    description: '자신의 즐겨찾기를 조회하는 메서드',
  })
  @ApiOkResponse({
    description: '즐겨찾기 목록을 반환한다.',
    type: LoadFavoritesOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-favorites')
  async loadFavorites(@AuthUser() user: User): Promise<LoadFavoritesOutput> {
    return await this.contentsService.loadFavorites(user);
  }

  @ApiOperation({
    summary: '콘텐츠 문서 요약',
    description: '콘텐츠의 문서를 요약하는 메서드',
  })
  @ApiOkResponse({
    description: '콘텐츠 문서 요약 성공 여부를 반환한다.',
    type: SummarizeContentOutput,
  })
  @ApiNotFoundResponse({
    description:
      '존재하지 않는 콘텐츠 또는 유저거나 접근이 불가능한 페이지인 경우',
    type: ErrorOutput,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청을 보냈을 경우',
    type: ErrorOutput,
  })
  @Get('summarize/:contentId')
  async summarizeContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<SummarizeContentOutput> {
    return await this.contentsService.summarizeContent(user, contentId);
  }

  // @ApiOperation({
  //   summary: '간편 문서 요약',
  //   description: '성능 테스트를 위해 만든 간편 문서 요약 메서드',
  // })
  // @ApiOkResponse({
  //   description: '간편 문서 요약 성공 여부를 반환한다.',
  //   type: SummarizeContentOutput,
  // })
  // @ApiBadRequestResponse({
  //   description: 'naver 서버에 잘못된 요청을 보냈을 경우',
  // })
  // @Post('summarize')
  // async testSummarizeContent(
  //   @Body() content: SummarizeContentBodyDto,
  // ): Promise<SummarizeContentOutput> {
  //   return await this.contentsService.testSummarizeContent(content);
  // }
}

@Controller('test')
@ApiTags('Test')
export class TestController {
  constructor(private readonly contentsService: ContentsService) {}

  @ApiOperation({
    summary: '간편 문서 요약',
    description: '성능 테스트를 위해 만든 간편 문서 요약 메서드',
  })
  @ApiOkResponse({
    description: '간편 문서 요약 성공 여부를 반환한다.',
    type: SummarizeContentOutput,
  })
  @ApiBadRequestResponse({
    description: 'naver 서버에 잘못된 요청을 보냈을 경우',
    type: ErrorOutput,
  })
  @Post('summarize')
  async testSummarizeContent(
    @Body() content: SummarizeContentBodyDto,
  ): Promise<SummarizeContentOutput> {
    return await this.contentsService.testSummarizeContent(content);
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
    type: ErrorOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 것일 경우',
    type: ErrorOutput,
  })
  @Post('add')
  @UseInterceptors(TransactionInterceptor)
  async addCategory(
    @AuthUser() user: User,
    @Body() addCategoryBody: AddCategoryBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<AddCategoryOutput> {
    return await this.categoryService.addCategory(
      user,
      addCategoryBody,
      queryRunnerManager,
    );
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
  @UseInterceptors(TransactionInterceptor)
  async updateCategory(
    @AuthUser() user: User,
    @Body() updateCategoryBody: UpdateCategoryBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<UpdateCategoryOutput> {
    return await this.categoryService.updateCategory(
      user,
      updateCategoryBody,
      queryRunnerManager,
    );
  }

  @ApiOperation({
    summary: '카테고리 삭제',
    description: '카테고리를 삭제하는 메서드',
  })
  @ApiOkResponse({
    description: '카테고리 삭제 성공 여부를 반환한다.',
    type: DeleteCategoryOutput,
  })
  @ApiNotFoundResponse({
    description: '존재하지 않는 카테고리를 삭제하려고 할 경우',
    type: ErrorOutput,
  })
  @Delete('delete/:categoryId')
  @UseInterceptors(TransactionInterceptor)
  async deleteCategory(
    @AuthUser() user: User,
    @Param('categoryId', new ParseIntPipe()) categoryId: number,
    @Query('deleteContentFlag', new ParseBoolPipe()) deleteContentFlag: boolean,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<DeleteCategoryOutput> {
    return await this.categoryService.deleteCategory(
      user,
      categoryId,
      deleteContentFlag,
      queryRunnerManager,
    );
  }

  @ApiOperation({
    summary: '자신의 카테고리 목록 조회',
    description: '자신의 카테고리 목록을 조회하는 메서드',
  })
  @ApiOkResponse({
    description: '카테고리 목록을 반환한다.',
    type: LoadPersonalCategoriesOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-categories')
  async loadPersonalCategories(
    @AuthUser() user: User,
  ): Promise<LoadPersonalCategoriesOutput> {
    return await this.categoryService.loadPersonalCategories(user);
  }

  @ApiOperation({
    summary: '최근 저장한 카테고리 조회',
    description: '최근 저장한 카테고리를 3개까지 조회하는 메서드',
  })
  @ApiOkResponse({
    description: '최근 저장한 카테고리를 최대 3개까지 반환한다.',
    type: LoadRecentCategoriesOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('load-recent-categories')
  async loadRecentCategories(
    @AuthUser() user: User,
  ): Promise<LoadRecentCategoriesOutput> {
    return await this.categoryService.loadRecentCategories(user);
  }
}
