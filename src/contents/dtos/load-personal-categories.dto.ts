import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CategoryTreeNode } from 'src/contents/dtos/category.dto';

export class LoadPersonalCategoriesOutput extends CoreOutput {
  @ApiProperty({
    description: '카테고리 목록',
    type: [CategoryTreeNode],
    required: false,
  })
  categoriesTree?: CategoryTreeNode[];
}
