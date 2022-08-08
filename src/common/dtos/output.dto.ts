import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CoreOutput {
  @ApiProperty({
    description: 'Status Code',
    example: 200,
  })
  statusCode?: number;

  @ApiProperty({ description: '에러 메시지', required: false })
  error?: string;
}
