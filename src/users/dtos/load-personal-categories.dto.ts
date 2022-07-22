import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from 'src/contents/entities/category.entity';

export class LoadPersonalCategoriesOutput extends CoreOutput {
  categories?: Category[];
}
