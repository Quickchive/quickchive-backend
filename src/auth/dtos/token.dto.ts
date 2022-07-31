import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { RefreshToken } from 'src/users/entities/refresh-token.entity';

export class RefreshTokenDto extends PickType(RefreshToken, ['refreshToken']) {}

export class RefreshTokenOutput extends CoreOutput {
  @ApiProperty()
  access_token?: string;

  @ApiProperty()
  refresh_token?: string;
}
