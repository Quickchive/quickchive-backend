import {
  CACHE_MANAGER,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { MailService } from '../mail/mail.service';
import { User, UserRole } from '../users/entities/user.entity';
import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { customJwtService } from './jwt/jwt.service';
import { Cache } from 'cache-manager';
import { LoginBodyDto, LogoutBodyDto } from './dtos/login.dto';
import { UsersModule } from '../users/users.module';
import { UserRepository } from '../users/repository/user.repository';
import { TWOHOUR } from './jwt/jwt.payload';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env.dev' });

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockUserId = 1;

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(mockUserId),
  set: jest.fn(),
  del: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: UserRepository;
  let jwtService: customJwtService;
  let cacheManager: Cache;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          username: 'quick_archive_test',
          password: 'test1234',
          database: 'quick_archive_test',
          host: '127.0.0.1',
          port: 5432,
          entities: ['src/**/entities/*.{ts,js}'],
          synchronize: true,
        }),
        UsersModule,
        JwtModule.registerAsync({
          useFactory: () => ({
            secret: process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
            signOptions: { expiresIn: TWOHOUR },
          }),
        }),
      ],
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
          useValue: mockCacheManager,
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

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get(UserRepository);
    jwtService = module.get(customJwtService);
    cacheManager = module.get(CACHE_MANAGER);
    dataSource = await module.get(DataSource);
  });

  afterEach(async () => {
    await dataSource.synchronize(true);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  // Mock 유저 생성
  beforeEach(async () => {
    const user = new User();
    user.name = 'test_user';
    user.email = 'test1@email.com';
    user.password = 'qwer1234';
    user.role = UserRole.Client;
    user.verified = true;

    await usersRepository.save(user);
  });

  describe('Jwt Login 테스트', () => {
    it('로그인에 성공한다', async () => {
      const loginBodyDto = new LoginBodyDto();
      loginBodyDto.email = 'test1@email.com';
      loginBodyDto.password = 'qwer1234';
      loginBodyDto.auto_login = true;

      const accessTokenSpy = jest.spyOn(jwtService, 'sign');
      const refreshTokenSpy = jest.spyOn(jwtService, 'generateRefreshToken');

      const loginOutput = await authService.jwtLogin(loginBodyDto);

      const accessToken = accessTokenSpy.mock.results[0].value;
      const refreshToken = refreshTokenSpy.mock.results[0].value;

      expect(loginOutput.access_token).toBe(accessToken);
      expect(loginOutput.refresh_token).toBe(refreshToken);
    });
  });

  describe('로그아웃 테스트', () => {
    // given
    const userId = mockUserId;
    const logoutBodyDto = new LogoutBodyDto();
    logoutBodyDto.refresh_token = 'refreshToken';

    it('로그아웃에 성공한다', async () => {
      // when
      // then
      await expect(
        authService.logout(userId, logoutBodyDto),
      ).resolves.not.toThrow();
    });

    it('유저가 존재하지 않아 실패한다', async () => {
      // given
      const userId = 2;

      // when
      // then
      await expect(authService.logout(userId, logoutBodyDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('토큰이 존재하지 않아 실패한다.', async () => {
      // given
      // cacheManager.get = jest.fn().mockImplementationOnce(() => undefined);

      mockCacheManager.get = jest.fn().mockResolvedValue(undefined);

      // when
      await expect(authService.logout(userId, logoutBodyDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('토큰이 유효하지 않아 실패한다.', async () => {
      // given
      // cacheManager.get = jest.fn().mockImplementationOnce(() => 2);

      mockCacheManager.get = jest.fn().mockResolvedValue(2);

      // when
      await expect(authService.logout(userId, logoutBodyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
