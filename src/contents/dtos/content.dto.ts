import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Content } from '../entities/content.entity';

class ContentBodyExceptLink extends PartialType(
  PickType(Content, ['title', 'comment', 'deadline', 'favorite']),
) {
  @ApiProperty({ description: 'Category Name', required: false })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiProperty({
    description: '부모 카테고리 id',
    example: 1,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}
class ContentBodyWithLinkOnly extends PickType(Content, ['link']) {}

export class AddContentBodyDto extends IntersectionType(
  ContentBodyWithLinkOnly,
  ContentBodyExceptLink,
) {}
export class AddContentOutput extends CoreOutput {}

export class AddMultipleContentsBodyDto {
  @ApiProperty({
    description: 'Content links',
    required: true,
    example: `["https://www.naver.com/", "https://www.google.com/"]`,
    isArray: true,
  })
  @IsString({ each: true })
  contentLinks: string[];
}

class ContentBody extends PartialType(AddContentBodyDto) {}
class ContentIdAndDescription extends PickType(Content, [
  'id',
  'description',
]) {}

export class UpdateContentBodyDto extends IntersectionType(
  ContentIdAndDescription,
  ContentBody,
) {}
export class UpdateContentOutput extends CoreOutput {}

export class DeleteContentOutput extends CoreOutput {}

export class toggleFavoriteOutput extends CoreOutput {}

export class checkReadFlagOutput extends CoreOutput {}

export class SummarizeContentBodyDto {
  @ApiProperty({ description: '콘텐츠 제목(필수 아님)', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '콘텐츠 내용', required: true })
  @IsString()
  content: string;
}

export class SummarizeContentOutput extends CoreOutput {
  @ApiProperty({ description: '요약된 콘텐츠', required: false })
  @IsString()
  @IsOptional()
  summary?: string;
}
