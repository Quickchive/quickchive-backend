import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CoreOutput } from '../../common/dtos/output.dto';
import { User } from '../../users/entities/user.entity';

export class LoginBodyDto extends PickType(User, ['email', 'password']) {
  @ApiProperty({
    description: '자동 로그인 여부',
    example: true,
  })
  @IsBoolean()
  auto_login!: boolean;
}

export class LoginOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: true })
  @IsString()
  access_token!: string;

  @ApiProperty({ description: 'refresh token', required: true })
  @IsString()
  refresh_token!: string;
}

export class LogoutBodyDto {
  @ApiProperty({ description: 'refresh token', required: true })
  @IsString()
  refresh_token!: string;
}

export class LogoutOutput extends CoreOutput {}
