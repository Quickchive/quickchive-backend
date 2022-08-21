import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { User } from 'src/users/entities/user.entity';
import { CollectionsService } from './collections.service';
import {
  AddCollectionBodyDto,
  AddCollectionOutput,
  UpdateCollectionBodyDto,
  UpdateCollectionOutput,
} from './dtos/collection.dto';
import {
  AddNestedContentToCollectionBodyDto,
  AddNestedContentToCollectionOutput,
} from './dtos/nested-content.dto';

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
  @Post('add')
  async addCollection(
    @AuthUser() user: User,
    @Body() collection: AddCollectionBodyDto,
  ): Promise<AddCollectionOutput> {
    return await this.collectionsService.addCollection(user, collection);
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
  async updateCollection(
    @AuthUser() user: User,
    @Body() collection: UpdateCollectionBodyDto,
  ): Promise<UpdateCollectionOutput> {
    return await this.collectionsService.updateCollection(user, collection);
  }

  // 콜렉션 삭제
}
