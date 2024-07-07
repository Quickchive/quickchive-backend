import { ApiProperty } from '@nestjs/swagger';

export class OAuthLoginRequest {
  @ApiProperty({
    description: 'OAuth 인증 토큰(ex. kakao access token, google id token)',
  })
  authorizationToken: string;
}
