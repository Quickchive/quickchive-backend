import { ApiProperty } from '@nestjs/swagger';

export class googleUserInfo {
  @ApiProperty({ description: 'google user email' })
  email: string;
  @ApiProperty({ description: 'google user name' })
  name: string;
  @ApiProperty({ description: 'google user access token' })
  accessToken: string;
}
