import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CoreOutput {
  @ApiProperty({ description: '요청 성공 여부' })
  @IsBoolean()
  ok: boolean;

  @ApiProperty({ description: '에러 메시지', required: false })
  error?: string;
}
