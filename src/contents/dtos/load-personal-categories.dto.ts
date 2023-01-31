import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from '../../common/dtos/output.dto';
import { CategoryTreeNode } from '../../contents/dtos/category.dto';
import { Category } from '../entities/category.entity';

export class LoadPersonalCategoriesOutput extends CoreOutput {
  @ApiProperty({
    description: '카테고리 목록',
    type: [CategoryTreeNode],
    required: false,
  })
  categoriesTree?: CategoryTreeNode[];
}

export class LoadRecentCategoriesOutput extends CoreOutput {
  @ApiProperty({
    description: '최근 저장한 카테고리 목록',
    type: [Category],
  })
  recentCategories!: Category[];
}
