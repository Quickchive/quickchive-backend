import { ApiProperty } from '@nestjs/swagger';

export class CoreOutput {
  @ApiProperty({
    description: 'Status Code',
    example: 409,
  })
  statusCode?: number;

  @ApiProperty({
    description: 'Error Message',
    example: 'Already Exists',
    required: false,
  })
  message?: string;

  @ApiProperty({ description: 'Meaning of http status code', required: false })
  error?: string;
}
