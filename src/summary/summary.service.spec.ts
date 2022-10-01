import { Test, TestingModule } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { SummaryService } from './summary.service';

describe('SummaryService', () => {
  let service: SummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiClientId: process.env.NAVER_API_CLIENT_ID,
            apiClientSecret: process.env.NAVER_API_CLIENT_SECRET,
            clovaSummaryRequestUrl: process.env.NAVER_CLOVA_SUMMARY_REQUEST_URL,
          },
        },
      ],
    }).compile();

    service = module.get<SummaryService>(SummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
