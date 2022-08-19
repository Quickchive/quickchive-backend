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

  @ApiOperation({
    summary: '콜렉션 수정',
    description: '콜렉션의 title, comment를 수정하는 메서드',
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
    return await this.collectionsService.addCollection(user, collection);
  }

  @ApiOperation({
    summary: '콜렉션에 콘텐츠 추가',
    description: '콜렉션에 단일 콘텐츠를 추가하는 메서드',
  })
  @ApiCreatedResponse({
    description: '콜렉션에 콘텐츠 추가 성공 여부를 반환한다.',
    type: AddCollectionOutput,
  })
  @ApiNotFoundResponse({
    description: '콜렉션을 찾을 수 없을 때 반환한다.',
  })
  @Post('add-content')
  async addNestedContentToCollection(
    @AuthUser() user: User,
    @Body() nestedContent: AddNestedContentToCollectionBodyDto,
  ): Promise<AddNestedContentToCollectionOutput> {
    return await this.collectionsService.addNestedContentToCollection(
      user,
      nestedContent,
    );
  }
}
