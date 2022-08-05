import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Content } from 'src/contents/entities/content.entity';

export class LoadPersonalContentsOutput extends CoreOutput {
  @ApiProperty({
    description: '아티클 목록',
    type: [Content],
    required: false,
  })
  contents?: Content[];
}

export class LoadFavoritesOutput extends CoreOutput {
  @ApiProperty({
    description: '즐겨찾기 목록',
    type: [Content],
    required: false,
  })
  favorites?: Content[];
}
