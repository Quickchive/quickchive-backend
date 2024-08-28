import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from '../../common/dtos/output.dto';
import { User } from '../../domain/user/entities/user.entity';

export class ValidateUserDto extends PickType(User, ['email', 'password']) {}

export class ValidateUserOutput extends CoreOutput {
  @ApiProperty({
    description: '사용자 정보',
  })
  user!: User;
}
