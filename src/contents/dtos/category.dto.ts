import { ApiProperty, PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

export class AddCategoryBodyDto {
  @ApiProperty({
    description: '카테고리 이름',
    example: '정보',
  })
  categoryName: string;
}
export class AddCategoryOutput extends CoreOutput {}

export class UpdateCategoryBodyDto extends PickType(Category, ['name']) {
  @ApiProperty({ description: '기존 카테고리 이름' })
  originalName: string;
}

export class UpdateCategoryOutput extends CoreOutput {}

export class DeleteCategoryOutput extends CoreOutput {}
