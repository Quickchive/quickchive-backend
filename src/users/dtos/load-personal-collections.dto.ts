import { ApiProperty } from '@nestjs/swagger';
import { Collection } from '../../collections/entities/collection.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

export class LoadPersonalCollectionsOutput extends CoreOutput {
  @ApiProperty({
    description: '콜렉션 목록',
    type: [Collection],
    required: false,
    isArray: true,
  })
  collections?: Collection[];
}
