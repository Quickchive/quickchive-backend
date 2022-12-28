import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

class passwordForResetPassword extends PickType(User, ['password']) {}
class codeForResetPassword {
  @ApiProperty({ description: 'Authentication code' })
  code: string;
}

export class ResetPasswordInput extends IntersectionType(
  passwordForResetPassword,
  codeForResetPassword,
) {}

export class ResetPasswordOutput extends CoreOutput {}
