import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

export class AddCategoryBodyDto {
  @ApiProperty({
    description: '카테고리 이름',
    example: '정보',
  })
  @IsString()
  categoryName: string;
}
export class AddCategoryOutput extends CoreOutput {}

// export class UpdateCategoryBodyDto extends PickType(Category, ['name']) {
//   @ApiProperty({ description: '기존 카테고리 이름' })
//   @IsString()
//   originalName: string;
// }
export class UpdateCategoryBodyDto extends PickType(Category, ['name']) {
  @ApiProperty({ description: '수정할 카테고리 id' })
  @IsNumber()
  categoryId: number;
}

export class UpdateCategoryOutput extends CoreOutput {}

export class DeleteCategoryOutput extends CoreOutput {}

export class categoryNameAndSlug {
  @ApiProperty({ description: '카테고리 이름' })
  @IsString()
  categoryName: string;

  @ApiProperty({ description: '카테고리 슬러그' })
  @IsString()
  categorySlug: string;
}
