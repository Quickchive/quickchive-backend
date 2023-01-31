import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CoreOutput } from '../../common/dtos/output.dto';

export class RefreshTokenDto {
  @ApiProperty({ description: 'refresh token', required: true })
  @IsString()
  refresh_token!: string;
}

export class RefreshTokenOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: true })
  @IsString()
  access_token!: string;

  @ApiProperty({ description: 'refresh token', required: true })
  @IsString()
  refresh_token!: string;
}
