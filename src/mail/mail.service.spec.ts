import { Test, TestingModule } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN_NAME,
            templateNameForVerifyEmail:
              process.env.MAILGUN_TEMPLATE_NAME_FOR_VERIFY_EMAIL,
            templateNameForResetPassword:
              process.env.MAILGUN_TEMPLATE_NAME_FOR_RESET_PASSWORD,
            templateNameForNotification:
              process.env.MAILGUN_TEMPLATE_NAME_FOR_NOTIFICATION,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
