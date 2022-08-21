import { ApiProperty, PickType } from '@nestjs/swagger';
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

export class UpdateCollectionBodyDto extends PickType(Collection, [
  'title',
  'comment',
]) {
  @ApiProperty({
    description: 'Collection ID',
    type: Number,
    required: true,
  })
  collectionId: number;

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
}
export class UpdateCollectionOutput extends CoreOutput {}

export class DeleteCollectionOutput extends CoreOutput {}
