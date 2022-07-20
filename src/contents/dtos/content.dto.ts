import { PickType } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Content } from '../entities/content.entity';

export class AddContentBodyDto extends PickType(Content, [
  'link',
  'title',
  'description',
  'comment',
]) {}

export class AddContentOutput extends CoreOutput {}
