import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { TransactionManager } from 'src/common/transaction.decorator';
import { toggleFavoriteOutput } from 'src/contents/dtos/content.dto';
import { User } from 'src/users/entities/user.entity';
import { EntityManager } from 'typeorm';
import { CollectionsService } from './collections.service';
import {
  AddCollectionBodyDto,
  AddCollectionOutput,
  DeleteCollectionOutput,
  UpdateCollectionBodyDto,
  UpdateCollectionOutput,
} from './dtos/collection.dto';

@Controller('collections')
@ApiTags('Collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @ApiOperation({
    summary: '콜렉션 추가',
    description: '콜렉션을 추가하는 메서드',
  })
  @ApiCreatedResponse({
    description: '콜렉션 추가 성공 여부를 반환한다.',
    type: AddCollectionOutput,
  })
  @ApiNotFoundResponse({
    description: '유저를 찾을 수 없을 때 반환한다.',
  })
  @ApiConflictResponse({
    description: '같은 title의 collection이 존재할 때 반환한다.',
  })
  @Post('add')
  @UseInterceptors(TransactionInterceptor)
  async addCollection(
    @AuthUser() user: User,
    @Body() collection: AddCollectionBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<AddCollectionOutput> {
    return await this.collectionsService.addCollection(
      user,
      collection,
      queryRunnerManager,
    );
  }

  /**
   * 콜렉션 수정
   * collection의 title, comment 수정
   * collection의 nestedcontent 추가
   * collection 내 nestedcontent 순서 변경
   * collection 내 nestedcontent 삭제
   */
  @ApiOperation({
    summary: '콜렉션 수정',
    description: `* 콜렉션의 title, comment 수정\n* 콜렉션의 nestedcontent 추가\n* 콜렉션 내 nestedcontent 순서 변경\n * 콜렉션 내 nestedcontent 삭제`,
  })
  @ApiCreatedResponse({
    description: '콜렉션 수정 성공 여부를 반환한다.',
    type: UpdateCollectionOutput,
  })
  @ApiNotFoundResponse({
    description: '콜렉션을 찾을 수 없을 때 반환한다.',
  })
  @Post('update')
  @UseInterceptors(TransactionInterceptor)
  async updateCollection(
    @AuthUser() user: User,
    @Body() collection: UpdateCollectionBodyDto,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<UpdateCollectionOutput> {
    return await this.collectionsService.updateCollection(
      user,
      collection,
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
    description: '콜렉션을 찾을 수 없을 때 반환한다.',
  })
  @Patch('favorite/:collectionId')
  @UseInterceptors(TransactionInterceptor)
  async toggleFavorite(
    @AuthUser() user: User,
    @Param('collectionId', new ParseIntPipe()) collectionId: number,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<toggleFavoriteOutput> {
    return await this.collectionsService.toggleFavorite(
      user,
      collectionId,
      queryRunnerManager,
    );
  }

  // 콜렉션 삭제
  @ApiOperation({
    summary: '콜렉션 삭제',
    description: '콜렉션을 삭제하는 메서드',
  })
  @ApiOkResponse({
    description: '콜렉션 삭제 성공 여부를 반환한다.',
    type: DeleteCollectionOutput,
  })
  @ApiNotFoundResponse({
    description: '콜렉션 또는 유저가 존재하지 않는다.',
  })
  @Delete('delete')
  @UseInterceptors(TransactionInterceptor)
  async deleteCollection(
    @AuthUser() user: User,
    @Query('collectionId', ParseIntPipe) collectionId: number,
    @TransactionManager() queryRunnerManager: EntityManager,
  ): Promise<DeleteCollectionOutput> {
    return await this.collectionsService.deleteCollection(
      user,
      collectionId,
      queryRunnerManager,
    );
  }
}
