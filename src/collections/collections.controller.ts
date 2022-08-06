import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
  @Post('add')
  async addContent(
    @AuthUser() user: User,
    @Body() collection: AddCollectionBodyDto,
  ): Promise<AddCollectionOutput> {
    return await this.collectionsService.addCollection(user, collection);
  }

  // @ApiOperation({
  //   summary: '아티클 정보 수정',
  //   description: '아티클을 수정하는 메서드',
  // })
  // @ApiCreatedResponse({
  //   description: '아티클 수정 성공 여부를 반환한다.',
  //   type: UpdateContentOutput,
  // })
  // @ApiBearerAuth('Authorization')
  // @UseGuards(JwtAuthGuard)
  // @Post('update')
  // async updateContent(
  //   @AuthUser() user: User,
  //   @Body() content: UpdateContentBodyDto,
  // ): Promise<UpdateContentOutput> {
  //   return await this.collectionsService.updateContent(user, content);
  // }

  // @ApiOperation({
  //   summary: '즐겨찾기 등록 및 해제',
  //   description: '즐겨찾기에 등록 및 해제하는 메서드',
  // })
  // @ApiCreatedResponse({
  //   description: '즐겨찾기 등록 및 해제 성공 여부를 반환한다.',
  //   type: toggleFavoriteOutput,
  // })
  // @ApiBearerAuth('Authorization')
  // @UseGuards(JwtAuthGuard)
  // @Patch('favorite/:contentId')
  // async toggleFavorite(
  //   @AuthUser() user: User,
  //   @Param('contentId', new ParseIntPipe()) contentId: number,
  // ): Promise<toggleFavoriteOutput> {
  //   return await this.collectionsService.toggleFavorite(user, contentId);
  // }

  // @ApiOperation({
  //   summary: '아티클 정보 삭제',
  //   description: '아티클을 삭제하는 메서드',
  // })
  // @ApiCreatedResponse({
  //   description: '아티클 삭제 성공 여부를 반환한다.',
  //   type: DeleteContentOutput,
  // })
  // @ApiBearerAuth('Authorization')
  // @UseGuards(JwtAuthGuard)
  // @Delete('delete/:contentId')
  // async deleteContent(
  //   @AuthUser() user: User,
  //   @Param('contentId', new ParseIntPipe()) contentId: number,
  // ): Promise<DeleteContentOutput> {
  //   return await this.collectionsService.deleteContent(user, contentId);
  // }
}
