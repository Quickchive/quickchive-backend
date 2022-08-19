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
  id: number;
}
export class UpdateCollectionOutput extends CoreOutput {}

export class DeleteCollectionOutput extends CoreOutput {}
