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
}
