import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Collection } from '../entities/collection.entity';

export class AddCollectionBodyDto extends PickType(Collection, [
  'title',
  'comment',
]) {
  @ApiProperty({
    description: 'Contents Link List',
    type: [String],
    required: false,
  })
  contentLinkList?: string[];

  @ApiProperty({
    description: 'Category Name',
    required: false,
  })
  categoryName?: string;
}
export class AddCollectionOutput extends CoreOutput {}

class UpdateCollectionTitleDto extends PartialType(
  PickType(Collection, ['title']),
) {}
class UpdateCollectionCommentDto extends PickType(Collection, ['comment']) {}

export class UpdateCollectionBodyDto extends IntersectionType(
  UpdateCollectionTitleDto,
  UpdateCollectionCommentDto,
) {
  @ApiProperty({
    description: 'Category Name',
    required: false,
  })
  categoryName?: string;

  @ApiProperty({
    description: 'Contents Link List(링크 순서대로 정렬됨)',
    type: [String],
    required: false,
  })
  contentLinkList?: string[];

  @ApiProperty({
    description: 'Collection ID',
    type: Number,
    required: true,
  })
  collectionId: number;
}
export class UpdateCollectionOutput extends CoreOutput {}

export class DeleteCollectionOutput extends CoreOutput {}
