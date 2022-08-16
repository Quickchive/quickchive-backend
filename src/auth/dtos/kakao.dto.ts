import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';

export class LoginWithKakaoDto {
  @ApiProperty({ description: 'kakao authorize code' })
  code: string;
}

export class KakaoAuthorizeOutput extends CoreOutput {
  @ApiProperty({
    description: 'kakao authorize url',
    required: false,
    example:
      'https://accounts.kakao.com/login?continue=https%3A%2F%2Fkauth.kakao.com%2Foauth%2Fauthorize%3Fresponse_type%3Dcode%26redirect_uri%3Dhttp%253A%252F%252F192.168.219.100%253A3000%252Fkakao%26through_account%3Dtrue%26client_id%3D4c900a593b6180',
  })
  url?: string;
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
