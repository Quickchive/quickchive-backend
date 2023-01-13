import { CACHE_MANAGER } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { customJwtService } from './jwt/jwt.service';
import { Cache } from 'cache-manager';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: MockRepository<User>;
  let mailService: MailService;
  let jwtService: customJwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        MailService,
        customJwtService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
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

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(getRepositoryToken(User));
    mailService = module.get(MailService);
    jwtService = module.get(customJwtService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
