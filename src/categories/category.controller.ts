import {
  Controller,
  UseGuards,
  Post,
  UseInterceptors,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { AuthUser } from '../auth/auth-user.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ErrorOutput } from '../common/dtos/output.dto';
import { TransactionInterceptor } from '../common/interceptors/transaction.interceptor';
import { TransactionManager } from '../common/transaction.decorator';
import {
  AddCategoryOutput,
  AddCategoryBodyDto,
  UpdateCategoryOutput,
  UpdateCategoryBodyDto,
  DeleteCategoryOutput,
  AutoCategorizeOutput,
} from './dtos/category.dto';
import {
  LoadPersonalCategoriesOutput,
  LoadFrequentCategoriesOutput,
} from './dtos/load-personal-categories.dto';
import { User } from '../users/entities/user.entity';
import { CategoryService } from './category.service';
import { AutoCategorizeRequest } from './dtos/auto-categorize.dto';

@Controller('categories')
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
  @Post()
  async addCategory(
    @AuthUser() user: User,
    @Body() addCategoryBody: AddCategoryBodyDto,
  ): Promise<AddCategoryOutput> {
    return this.categoryService.addCategory(user, addCategoryBody);
  }

  @ApiOperation({
    summary: '카테고리 수정',
    description: '카테고리 이름을 수정하는 메서드',
  })
  @ApiCreatedResponse({
    description: '카테고리 수정 성공 여부를 반환한다.',
    type: UpdateCategoryOutput,
  })
  @Patch()
  @UseInterceptors(TransactionInterceptor)
  async updateCategory(
    @AuthUser() user: User,
    @Body() updateCategoryBody: UpdateCategoryBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<UpdateCategoryOutput> {
    return this.categoryService.updateCategory(
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
  @Delete(':categoryId')
  @UseInterceptors(TransactionInterceptor)
  async deleteCategory(
    @AuthUser() user: User,
    @Param('categoryId', new ParseIntPipe()) categoryId: number,
    @Query('deleteContentFlag', new ParseBoolPipe()) deleteContentFlag: boolean,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<DeleteCategoryOutput> {
    return this.categoryService.deleteCategory(
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
  @Get()
  async loadPersonalCategories(
    @AuthUser() user: User,
  ): Promise<LoadPersonalCategoriesOutput> {
    return this.categoryService.loadPersonalCategories(user);
  }

  @ApiOperation({
    summary: '자주 저장한 카테고리 조회',
    description: '자주 저장한 카테고리를 3개까지 조회하는 메서드',
  })
  @ApiOkResponse({
    description: '자주 저장한 카테고리를 최대 3개까지 반환한다.',
    type: LoadFrequentCategoriesOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('frequent')
  async loadFrequentCategories(
    @AuthUser() user: User,
  ): Promise<LoadFrequentCategoriesOutput> {
    return this.categoryService.loadFrequentCategories(user);
  }

  @ApiOperation({
    summary: '아티클 카테고리 자동 지정',
    description:
      '아티클에 적절한 카테고리를 유저의 카테고리 목록에서 찾는 메서드',
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('auto-categorize')
  async autoCategorize(
    @AuthUser() user: User,
    @Query() { link }: AutoCategorizeRequest,
  ): Promise<AutoCategorizeOutput> {
    return this.categoryService.autoCategorize(user, link);
  }
}
