import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { LoadPersonalContentsOutput } from './dtos/load-personal-contents.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('load-contents')
  async loadPersonalContents(
    @AuthUser() user: User,
  ): Promise<LoadPersonalContentsOutput> {
    return await this.usersService.loadPersonalContents(user);
  }
}
