import { PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../../users/entities/user.entity';

export class LoginBodyDto extends PickType(User, ['name', 'password']) {}

export class LoginOutput extends CoreOutput {
  access_token?: string;

  refresh_token?: string;
}

export class LogoutOutput extends CoreOutput {}
