import { PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

export class ResetPasswordInput extends PickType(User, ['password']) {}

export class ResetPasswordOutput extends CoreOutput {}
