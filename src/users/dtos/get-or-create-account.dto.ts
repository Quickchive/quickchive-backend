import { PickType } from '@nestjs/swagger';
import { User } from '../../domain/user/entities/user.entity';

export class GetOrCreateAccountBodyDto extends PickType(User, [
  'email',
  'name',
  'profileImage',
  'password',
]) {}
