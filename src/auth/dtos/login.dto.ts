import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../../users/entities/user.entity';

export class LoginBodyDto extends PickType(User, ['email', 'password']) {}

export class LoginOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: false })
  access_token?: string;

  @ApiProperty({ description: 'refresh token', required: false })
  refresh_token?: string;
}

export class LogoutOutput extends CoreOutput {}
