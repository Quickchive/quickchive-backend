import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from 'src/contents/entities/category.entity';

export class LoadPersonalCategoriesOutput extends CoreOutput {
  @ApiProperty({
    description: '카테고리 목록',
  })
  categories?: Category[];
}
