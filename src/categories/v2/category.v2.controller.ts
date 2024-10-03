import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { CategoryService } from '../category.service';
import { AuthUser } from '../../auth/auth-user.decorator';
import { User } from '../../users/entities/user.entity';
import { RecommendedCategoryResponseDto } from './dto/recommended-category-response.dto';

@Controller('v2/categories')
@ApiTags('Category v2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CategoryV2Controller {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({
    summary: '아티클 카테고리 자동 지정',
    description:
      '아티클에 적절한 카테고리를 유저의 카테고리 목록에서 찾는 메서드',
  })
  @UseGuards(JwtAuthGuard)
  @Get('auto-categorize')
  async autoCategorize(@AuthUser() user: User, @Query('link') link: string) {
    const { category } = await this.categoryService.autoCategorizeWithId(
      user,
      link,
    );

    return new RecommendedCategoryResponseDto(category);
  }
}
