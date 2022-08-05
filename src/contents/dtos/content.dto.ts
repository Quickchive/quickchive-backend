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

export class UpdateContentBodyDto extends AddContentBodyDto {}
export class UpdateContentOutput extends CoreOutput {}

export class DeleteContentOutput extends CoreOutput {}

export class toggleFavoriteOutput extends CoreOutput {}
