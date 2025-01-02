import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
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
  @IsString({ each: true })
  @IsOptional()
  contentLinkList?: string[];

  @ApiProperty({
    description: 'Category Name',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryName?: string;
}
export class AddCollectionOutput extends CoreOutput {}

class UpdateCollectionTitleDto extends PartialType(
  PickType(Collection, ['title']),
) {}
class UpdateCollectionCommentDto extends PickType(Collection, [
  'comment',
  'favorite',
]) {}

export class UpdateCollectionBodyDto extends IntersectionType(
  UpdateCollectionTitleDto,
  UpdateCollectionCommentDto,
) {
  @ApiProperty({
    description: 'Category Name',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiProperty({
    description: 'Contents Link List(링크 순서대로 정렬됨)',
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  contentLinkList?: string[];

  @ApiProperty({
    description: 'Collection ID',
    type: Number,
    required: true,
  })
  @IsNumber()
  collectionId!: number;
}
export class UpdateCollectionOutput extends CoreOutput {}

export class DeleteCollectionOutput extends CoreOutput {}
