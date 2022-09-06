import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class RefreshTokenDto {
  @ApiProperty({ description: 'refresh token', required: true })
  @IsString()
  refresh_token: string;
}

export class RefreshTokenOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: false })
  @IsString()
  @IsOptional()
  access_token?: string;

  @ApiProperty({ description: 'refresh token', required: false })
  @IsString()
  @IsOptional()
  refresh_token?: string;
}
