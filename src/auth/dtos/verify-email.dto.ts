import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class VerifyEmailOutput extends CoreOutput {
  @ApiProperty({ description: '인증된 이메일', required: false })
  email?: string;
}
