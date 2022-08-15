import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';

export class LoginWithKakaoDto {
  @ApiProperty({ description: 'kakao authorize code' })
  code: string;
}

export class CreateKakaoAccountBodyDto extends PickType(User, [
  'email',
  'name',
  'password',
]) {}
export class CreateKakaoAccountOutput extends CoreOutput {
  @ApiProperty({ description: 'user', required: false })
  user?: User;
}

export class GetKakaoAccessTokenOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: false })
  access_token?: string;
}

export class GetKakaoUserInfoOutput extends CoreOutput {
  @ApiProperty({ description: 'user info', required: false })
  userInfo?: any;
}
