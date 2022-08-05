import { OmitType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class meOutput extends OmitType(User, ['password']) {}
