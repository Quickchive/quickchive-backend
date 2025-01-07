import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class AutoCategorizeRequest {
  @ApiProperty({
    description: '링크',
    type: String,
  })
  @IsString()
  @IsUrl({}, { message: '링크가 올바르지 않습니다.' })
  link: string;
}
