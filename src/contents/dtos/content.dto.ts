import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Content } from '../entities/content.entity';

class ContentBodyExceptLink extends PartialType(
  PickType(Content, ['title', 'description', 'comment', 'deadline']),
) {
  @ApiProperty({ description: 'Category Name', required: false })
  categoryName: string;
}
class ContentBodyWithLinkOnly extends PickType(Content, ['link']) {}

export class AddContentBodyDto extends IntersectionType(
  ContentBodyWithLinkOnly,
  ContentBodyExceptLink,
) {}
export class AddContentOutput extends CoreOutput {}

class ContentBody extends PartialType(AddContentBodyDto) {}
class ContentId extends PickType(Content, ['id']) {}

export class UpdateContentBodyDto extends IntersectionType(
  ContentId,
  ContentBody,
) {}
export class UpdateContentOutput extends CoreOutput {}

export class DeleteContentOutput extends CoreOutput {}

export class toggleFavoriteOutput extends CoreOutput {}
