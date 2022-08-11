import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Collection } from '../entities/collection.entity';

export class AddCollectionBodyDto extends PickType(Collection, [
  'title',
  'comment',
]) {
  @ApiProperty({
    description: 'Contents ID List',
    type: [String],
    required: false,
  })
  contentLinkList?: string[];
}
export class AddCollectionOutput extends CoreOutput {}

export class UpdateCollectionBodyDto extends AddCollectionBodyDto {}
export class UpdateCollectionOutput extends CoreOutput {}

export class DeleteCollectionOutput extends CoreOutput {}
