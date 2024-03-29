import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class googleUserInfo {
  @ApiProperty({ description: 'google user email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'google user name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'google user profile image' })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({ description: 'google user access token' })
  @IsString()
  accessToken!: string;
}
