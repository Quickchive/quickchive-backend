import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthLoginRequest {
  @ApiProperty({
    description: 'OAuth 인증 토큰(ex. kakao access token, google id token)',
  })
  @IsString()
  @IsNotEmpty()
  authorizationToken: string;
}
