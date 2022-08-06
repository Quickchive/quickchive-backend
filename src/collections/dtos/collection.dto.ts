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
  @ApiProperty({ description: 'Contents ID List', required: false })
  contentIdList: number[];
}
export class AddCollectionOutput extends CoreOutput {}

export class UpdateCollectionBodyDto extends AddCollectionBodyDto {}
export class UpdateCollectionOutput extends CoreOutput {}

export class DeleteCollectionOutput extends CoreOutput {}
