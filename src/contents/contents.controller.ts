import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { User } from 'src/users/entities/user.entity';
import { ContentsService } from './contents.service';
import { AddContentBodyDto, AddContentOutput } from './dtos/content.dto';

@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addContent(
    @AuthUser() user: User,
    @Body() content: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    return await this.contentsService.addContent(user, content);
  }
}

// @Controller('category')
// export class CategoryController {
//   constructor(private readonly categoryService: CategoryService) {}

//   @UseGuards(JwtAuthGuard)
//   @Post('add')
//   async addCategory(
//     @AuthUser() user: User,
//     @Body() categoryName: string,
//   ): Promise<AddCategoryOutput> {
//     return await this.categoryService.addCategory(user, categoryName);
//   }
// }
