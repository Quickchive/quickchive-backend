import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';
import { Verification } from '../entities/verification.entity';

class passwordForResetPassword extends PickType(User, ['password']) {}
class codeForResetPassword extends PickType(Verification, ['code']) {}

export class ResetPasswordInput extends IntersectionType(
  passwordForResetPassword,
  codeForResetPassword,
) {}

export class ResetPasswordOutput extends CoreOutput {}
