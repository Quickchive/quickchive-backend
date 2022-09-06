import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { NestedContent } from '../entities/nested-content.entity';

class NestedContentBodyExceptLink extends PartialType(
  PickType(NestedContent, ['title', 'description']),
) {}
class NestedContentBodyWithLinkOnly extends PickType(NestedContent, ['link']) {}

export class AddNestedContentBodyDto extends IntersectionType(
  NestedContentBodyWithLinkOnly,
  NestedContentBodyExceptLink,
) {}
export class AddNestedContentOutput {
  @ApiProperty({ description: 'Created Nested Content' })
  nestedContent: NestedContent;
}

export class AddNestedContentToCollectionBodyDto extends AddNestedContentBodyDto {
  @ApiProperty({ description: 'Collection ID' })
  @IsNumber()
  collectionId: number;
}
export class AddNestedContentToCollectionOutput extends CoreOutput {}

class NestedContentBody extends PartialType(AddNestedContentOutput) {}
class NestedContentId extends PickType(NestedContent, ['id']) {}

export class UpdateNestedContentBodyDto extends IntersectionType(
  NestedContentId,
  NestedContentBody,
) {}
export class UpdateNestedContentOutput extends CoreOutput {}

export class DeleteNestedContentOutput extends CoreOutput {}
