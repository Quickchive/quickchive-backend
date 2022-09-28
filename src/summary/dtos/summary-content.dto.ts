import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class SummarizeDocumentInput {
  @ApiProperty({ description: '콘텐츠 제목', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '콘텐츠 내용', required: true })
  @IsString()
  content: string;
}

export class SummarizeDocumentOutput extends CoreOutput {
  @ApiProperty({ description: '요약된 콘텐츠', required: false })
  @IsString()
  @IsOptional()
  summary?: string;
}
