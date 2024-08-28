import { OmitType } from '@nestjs/swagger';
import { User } from '../../domain/user/entities/user.entity';

export class meOutput extends OmitType(User, ['password']) {}
