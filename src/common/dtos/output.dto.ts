import { ApiProperty } from '@nestjs/swagger';

export class CoreOutput {
  @ApiProperty({
    description: 'Status Code',
    type: Number,
    example: 200,
  })
  statusCode?: number;
}

export class ErrorOutput {
  @ApiProperty({
    description: 'Status Code',
    type: Number,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error Message',
    required: false,
  })
  message?: string;

  @ApiProperty({ description: 'Meaning of http status code', required: false })
  error?: string;
}
