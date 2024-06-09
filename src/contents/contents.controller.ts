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
import { ContentsService } from './contents.service';
import {
  AddContentBodyDto,
  AddContentOutput,
  AddMultipleContentsBodyDto,
  DeleteContentOutput,
  SummarizeContentOutput,
  toggleFavoriteOutput,
  UpdateContentBodyDto,
  UpdateContentOutput,
} from './dtos/content.dto';
import { ErrorOutput } from '../common/dtos/output.dto';
import {
  LoadFavoritesOutput,
  LoadPersonalContentsOutput,
} from './dtos/load-personal-contents.dto';
import { LoadReminderCountOutput } from './dtos/load-personal-remider-count.dto';
import { GetLinkInfoResponseDto } from './dtos/get-link.response.dto';

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
  @Post()
  async addContent(
    @AuthUser() user: User,
    @Body() content: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    return this.contentsService.addContent(user, content);
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
  @Post('multiple')
  async addMultipleContents(
    @AuthUser() user: User,
    @Body() contentLinks: AddMultipleContentsBodyDto,
  ): Promise<AddContentOutput> {
    return this.contentsService.addMultipleContents(user, contentLinks);
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
  @Patch()
  async updateContent(
    @AuthUser() user: User,
    @Body() content: UpdateContentBodyDto,
  ): Promise<UpdateContentOutput> {
    return this.contentsService.updateContent(user, content);
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
  @Patch(':contentId/favorite')
  async toggleFavorite(
    @AuthUser() user: User,
    @Param('contentId', ParseIntPipe) contentId: number,
  ): Promise<toggleFavoriteOutput> {
    return this.contentsService.toggleFavorite(user, contentId);
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
  @Delete(':contentId')
  async deleteContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<DeleteContentOutput> {
    return this.contentsService.deleteContent(user, contentId);
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
  @Get()
  async loadPersonalContents(
    @AuthUser() user: User,
    @Query('categoryId') categoryId?: number,
  ): Promise<LoadPersonalContentsOutput> {
    if (categoryId) categoryId = +categoryId;
    return this.contentsService.loadPersonalContents(user, categoryId);
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
  @Get('favorite')
  async loadFavorites(@AuthUser() user: User): Promise<LoadFavoritesOutput> {
    return this.contentsService.loadFavorites(user);
  }

  @ApiOperation({
    summary: '자신의 리마인더 개수 조회',
    description: '자신의 리마인더 개수를 조회하는 메서드',
  })
  @ApiOkResponse({
    description: '설정되어있는 리마인더 개수를 반환한다.',
    type: LoadReminderCountOutput,
  })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtAuthGuard)
  @Get('reminder-count')
  async loadReminderCount(
    @AuthUser() user: User,
  ): Promise<LoadReminderCountOutput> {
    return this.contentsService.loadReminderCount(user);
  }

  @ApiOperation({
    summary: 'OG 데이터 크롤링',
    description: '링크 내 OG 데이터를 파싱합니다.',
  })
  @ApiOkResponse({
    type: GetLinkInfoResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Get('/og')
  async getOgData(@Query('link') link: string) {
    return this.contentsService.getLinkInfo(link);
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
  @Get(':contentId/summarize')
  async summarizeContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ): Promise<SummarizeContentOutput> {
    return this.contentsService.summarizeContent(user, contentId);
  }

  @ApiOperation({
    summary: '삭제된 컨텐츠 복원',
    description: '삭제된 컨텐츠를 복원합니다.',
  })
  @ApiOkResponse({
    description: '삭제된 컨텐츠 복원 성공 여부를 반환합니다.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':contentId/restore')
  async restoreContent(
    @AuthUser() user: User,
    @Param('contentId', new ParseIntPipe()) contentId: number,
  ) {
    return this.contentsService.restoreContent(user, contentId);
  }
}
