import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Content } from '../entities/content.entity';

class ContentBodyExceptLink extends PartialType(
  PickType(Content, ['title', 'comment', 'deadline', 'favorite']),
) {
  @ApiProperty({ description: 'Category Name', required: false })
  @IsString()
  @IsOptional()
  categoryName?: string;
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
