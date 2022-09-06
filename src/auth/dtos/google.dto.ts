import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class googleUserInfo {
  @ApiProperty({ description: 'google user email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'google user name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'google user access token' })
  @IsString()
  accessToken: string;
}
