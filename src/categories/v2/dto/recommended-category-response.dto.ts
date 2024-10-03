import { ApiProperty } from '@nestjs/swagger';

export class RecommendedCategoryResponseDto {
  @ApiProperty({
    description: '카테고리 id',
  })
  id: number;

  @ApiProperty({
    description: '카테고리 이름',
  })
  name: string;

  constructor({ id, name }: { id: number; name: string }) {
    this.id = id;
    this.name = name;
  }
}
