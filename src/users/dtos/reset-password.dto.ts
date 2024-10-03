import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { CoreOutput } from '../../common/dtos/output.dto';
import { User } from '../../domain/user/entities/user.entity';

class passwordForResetPassword extends PickType(User, ['password']) {}
class codeForResetPassword {
  @ApiProperty({ description: 'Authentication code' })
  code!: string;
}

export class ResetPasswordInput extends IntersectionType(
  passwordForResetPassword,
  codeForResetPassword,
) {}

export class ResetPasswordOutput extends CoreOutput {}
