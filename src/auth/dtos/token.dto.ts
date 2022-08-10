import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token', required: true })
  refresh_token: string;
}

export class RefreshTokenOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: false })
  access_token?: string;

  @ApiProperty({ description: 'refresh token', required: false })
  refresh_token?: string;
}
