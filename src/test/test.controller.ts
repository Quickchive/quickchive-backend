import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ErrorOutput } from '../common/dtos/output.dto';
import { ContentsService } from '../contents/contents.service';
import {
  AutoCategorizeBodyDto,
  AutoCategorizeOutput,
} from '../categories/dtos/category.dto';
import {
  SummarizeContentOutput,
  SummarizeContentBodyDto,
} from '../contents/dtos/content.dto';
import { CategoryService } from '../categories/category.service';

@Controller('test')
@ApiTags('Test')
export class TestController {
  constructor(
    private readonly contentsService: ContentsService,
    private readonly categoryService: CategoryService,
  ) {}

  @ApiOperation({
    summary: '간편 문서 요약',
    description: '성능 테스트를 위해 만든 간편 문서 요약 메서드',
  })
  @ApiOkResponse({
    description: '간편 문서 요약 성공 여부를 반환한다.',
    type: SummarizeContentOutput,
  })
  @ApiBadRequestResponse({
    description: 'naver 서버에 잘못된 요청을 보냈을 경우',
    type: ErrorOutput,
  })
  @Post('summarize')
  async testSummarizeContent(
    @Body() content: SummarizeContentBodyDto,
  ): Promise<SummarizeContentOutput> {
    return this.contentsService.testSummarizeContent(content);
  }

  @ApiOperation({
    summary: '아티클 카테고리 자동 지정 (테스트용)',
    description: 'url을 넘기면 적절한 아티클 카테고리를 반환하는 메서드',
  })
  @Post('auto-categorize')
  async autoCategorize(
    @Body() autoCategorizeBody: AutoCategorizeBodyDto,
  ): Promise<AutoCategorizeOutput> {
    return this.categoryService.autoCategorizeForTest(autoCategorizeBody);
  }
}
