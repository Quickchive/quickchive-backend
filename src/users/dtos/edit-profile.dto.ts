import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

export class EditProfileOutput extends CoreOutput {}

export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password', 'name']),
) {
  @ApiProperty({ description: '기존 비밀번호', required: false })
  oldPassword?: string;
}
