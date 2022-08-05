import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { RefreshToken } from 'src/users/entities/refresh-token.entity';

export class RefreshTokenDto extends PickType(RefreshToken, ['refreshToken']) {}

export class RefreshTokenOutput extends CoreOutput {
  @ApiProperty({ description: 'access token', required: false })
  access_token?: string;

  @ApiProperty({ description: 'refresh token', required: false })
  refresh_token?: string;
}
