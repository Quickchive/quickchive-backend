import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Category } from '../entities/category.entity';

export class AddCategoryBodyDto {
  @ApiProperty({
    description: '카테고리 이름',
    example: '정보',
  })
  @IsString()
  categoryName!: string;

  @ApiProperty({
    description: '부모 카테고리 id',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}
export class AddCategoryOutput extends CoreOutput {}

export class UpdateCategoryBodyDto extends PartialType(
  PickType(Category, ['name', 'parentId']),
) {
  @ApiProperty({ description: '수정할 카테고리 id' })
  @IsNumber()
  categoryId!: number;
}

export class UpdateCategoryOutput extends CoreOutput {}

export class DeleteCategoryOutput extends CoreOutput {}

export class CategorySlug {
  @ApiProperty({ description: '카테고리 슬러그' })
  @IsString()
  categorySlug!: string;
}

export class CategoryTreeNode extends Category {
  @ApiProperty({ description: '자식 카테고리' })
  children?: CategoryTreeNode[];
}

export interface RecentCategoryList {
  categoryId: number;
  savedAt: number;
}

export interface RecentCategoryListWithSaveCount extends RecentCategoryList {
  saveCount: number;
}

export class AutoCategorizeBodyDto {
  @ApiProperty({ description: '아티클 link' })
  @IsString()
  link!: string;

  @ApiProperty({
    description: '카테고리들',
    example: ['정보', '경제', '개발', '인공지능'],
  })
  categories!: string[];
}

export class AutoCategorizeOutput extends CoreOutput {
  @ApiProperty({ description: '카테고리', example: '개발' })
  category!: string;
}
