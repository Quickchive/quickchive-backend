import { PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class GetOrCreateAccountBodyDto extends PickType(User, [
  'email',
  'name',
  'password',
]) {}
