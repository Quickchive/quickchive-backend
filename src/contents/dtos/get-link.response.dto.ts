import { ApiPropertyOptional } from '@nestjs/swagger';
import { LinkInfo } from '../types/link-info.interface';

export class GetLinkInfoResponseDto {
  @ApiPropertyOptional({
    description: '아티클 제목',
    example: '[Terraform] 테라폼 훑어보기 — 턴태의 밑바닥부터 시작하는 de-vlog',
  })
  private readonly title?: string;

  @ApiPropertyOptional({
    description: '아티클 본문 일부',
    example:
      '인프라 구조마저 코드로 조작하고 있는 현재, 가장 많이 쓰이는 도구는 테라폼과 앤서블이 있습니다.',
  })
  private readonly description?: string;

  @ApiPropertyOptional({
    description: '썸네일/커버 이미지',
    example:
      'https://img1.daumcdn.net/thumb/R800x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2Fz52vz%2FbtsCAOBzgTR%2FhFgGDKkr6iKWfU6eKeKUVk%2Fimg.png',
  })
  private readonly coverImg?: string;

  @ApiPropertyOptional({
    description: '아티클 사이트 주소',
    example: '턴태의 밑바닥부터 시작하는 de-vlog',
  })
  private readonly siteName?: string;

  constructor(linkInfo: LinkInfo) {
    this.title = linkInfo.title;
    this.description = linkInfo.description;
    this.coverImg = linkInfo.coverImg;
    this.siteName = linkInfo.siteName;
  }
}
