import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from '../../common/dtos/output.dto';
import { CategoryTreeNode } from './category.dto';
import { Category } from '../category.entity';

export class LoadPersonalCategoriesOutput extends CoreOutput {
  @ApiProperty({
    description: '카테고리 목록',
    type: [CategoryTreeNode],
    required: false,
  })
  categoriesTree?: CategoryTreeNode[];
}

export class LoadFrequentCategoriesOutput extends CoreOutput {
  @ApiProperty({
    description: '자주 저장한 카테고리 목록',
    type: [Category],
  })
  frequentCategories!: Category[];
}
