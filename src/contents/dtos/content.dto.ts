import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Content } from '../entities/content.entity';
import { Type } from 'class-transformer';

export class AddContentBodyDto {
  @ApiProperty({ example: 'ex.com', description: '아티클 주소' })
  @IsString()
  @IsUrl({}, { message: '아티클 주소가 올바르지 않습니다.' })
  link: string;

  @ApiPropertyOptional({
    description: '아티클 제목',
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '아티클 설명/메모',
    type: String,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Article Reminder Date(YYYY-MM-DD HH:mm:ss)',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminder?: Date;

  @ApiPropertyOptional({
    description: '즐겨찾기 여부',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @ApiPropertyOptional({
    description: '카테고리 이름',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryName?: string;

  @ApiPropertyOptional({
    description: '부모 카테고리 id',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parentId?: number;

  @ApiPropertyOptional({
    description: '카테고리 id',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  categoryId?: number;
}

export class AddContentOutput extends CoreOutput {}

export class AddMultipleContentsBodyDto {
  @ApiProperty({
    description: 'Content links',
    required: true,
    example: `["https://www.naver.com/", "https://www.google.com/"]`,
    isArray: true,
  })
  @IsString({ each: true })
  contentLinks!: string[];

  @ApiProperty({ description: 'Category Name', required: false })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiProperty({ description: '카테고리 id', required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    description: '부모 카테고리 id',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}

class ContentBody extends PartialType(AddContentBodyDto) {}

class ContentIdAndDescription extends PickType(Content, [
  'id',
  'description',
]) {}

export class UpdateContentBodyDto {
  @ApiProperty({
    description: '컨텐츠 id',
  })
  @IsInt()
  @IsPositive()
  id: number;

  @ApiPropertyOptional({
    description: '컨텐츠 설명',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly description?: string;

  @ApiPropertyOptional({
    description: '컨텐츠 링크',
  })
  @IsUrl()
  @IsNotEmpty()
  @IsOptional()
  readonly link?: string;

  @ApiPropertyOptional({
    description: '컨텐츠 제목',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly title?: string;

  @ApiPropertyOptional({
    description: '컨텐츠 메모',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly comment?: string;

  @ApiPropertyOptional({
    description: '리마인더 시간',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  readonly reminder?: Date;

  @ApiPropertyOptional({
    description: '즐겨찾기 여부',
  })
  @IsBoolean()
  @IsOptional()
  readonly favorite?: boolean;

  @ApiPropertyOptional({
    description: '카테고리 id',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  readonly categoryId?: number;
}

export class UpdateContentRequest {
  @ApiPropertyOptional({
    description: '컨텐츠 설명',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly description?: string;

  @ApiPropertyOptional({
    description: '컨텐츠 링크',
  })
  @IsUrl()
  @IsNotEmpty()
  @IsOptional()
  readonly link?: string;

  @ApiPropertyOptional({
    description: '컨텐츠 제목',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly title?: string;

  @ApiPropertyOptional({
    description: '컨텐츠 메모',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly comment?: string;

  @ApiPropertyOptional({
    description: '리마인더 시간',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  readonly reminder?: Date;

  @ApiPropertyOptional({
    description: '즐겨찾기 여부',
  })
  @IsBoolean()
  @IsOptional()
  readonly favorite?: boolean;

  @ApiPropertyOptional({
    description: '카테고리 id',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  readonly categoryId?: number;
}

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
  content!: string;
}

export class SummarizeContentOutput extends CoreOutput {
  @ApiProperty({ description: '요약된 콘텐츠', required: false })
  @IsString()
  @IsOptional()
  summary?: string;
}
