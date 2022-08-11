import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { NestedContent } from '../entities/nested-content.entity';

class NestedContentBodyExceptLink extends PartialType(
  PickType(NestedContent, ['title', 'description', 'comment']),
) {}
class NestedContentBodyWithLinkOnly extends PickType(NestedContent, ['link']) {}

export class NestedAddContentBodyDto extends IntersectionType(
  NestedContentBodyWithLinkOnly,
  NestedContentBodyExceptLink,
) {}
export class NestedAddContentOutput {
  @ApiProperty({ description: 'Nested Content ID List' })
  nestedContent: NestedContent;
}

class NestedContentBody extends PartialType(NestedAddContentBodyDto) {}
class NestedContentId extends PickType(NestedContent, ['id']) {}

export class NestedUpdateContentBodyDto extends IntersectionType(
  NestedContentId,
  NestedContentBody,
) {}
export class NestedUpdateContentOutput extends CoreOutput {}

export class NestedDeleteContentOutput extends CoreOutput {}

export class toggleFavoriteOutput extends CoreOutput {}
