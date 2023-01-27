import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Content } from '../../contents/entities/content.entity';

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
    description: '즐겨찾기한 콘텐츠 목록',
    type: [Content],
    required: false,
    isArray: true,
  })
  favorite_contents?: Content[];

  // @ApiProperty({
  //   description: '즐겨찾기한 콜렉션 목록',
  //   type: [Collection],
  //   required: false,
  //   isArray: true,
  // })
  // favorite_collections?: Collection[];
}
