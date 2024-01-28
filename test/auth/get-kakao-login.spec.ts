import { getBuilder } from '../common/application-builder';
import {
  BadRequestException,
  CACHE_MANAGER,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { OAuthUtil } from '../../src/auth/util/oauth.util';
import { User } from '../../src/users/entities/user.entity';
import * as request from 'supertest';
import { cacheManagerMock } from '../mock/cache-manager.mock';
import { oAuthUtilMock } from '../mock/oauth-util.mock';
import { Seeder } from '../seeder/seeder.interface';
import { UserSeeder } from '../seeder/user.seeder';
import { DataSource, Repository } from 'typeorm';

jest.setTimeout(30_000);
describe('[GET] /api/oauth/kakao-login', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;

  // Service
  let oauthUtil: OAuthUtil;

  // Database
  let userRepository: Repository<User>;

  // Seeder
  const userSeeder: Seeder<User> = new UserSeeder();

  // Stub
  let userStub: User;

  beforeAll(async () => {
    const {
      builder,
      container: _container,
      dataSource: _dataSource,
    } = await getBuilder();
    container = _container;
    dataSource = _dataSource;

    const module = await builder
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .overrideProvider(OAuthUtil)
      .useValue(oAuthUtilMock)
      .overrideProvider(CACHE_MANAGER)
      .useValue(cacheManagerMock)
      .compile();

    app = module.createNestApplication();
    await app.init();

    oauthUtil = app.get(OAuthUtil);
    userRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  /**
   * 1. 카카오 로그인에 성공한다.
   * 2. 카카오 인증을 받지 못해 실패한다.
   * 3. 이메일 수집에 동의하지 않아 실패한다.
   */

  describe('카카오 로그인에 성공한다.', () => {
    it('200을 반환한다.', async () => {
      const emailStub = 'test@email.com';
      const nicknameStub = 'test';
      oauthUtil.getKakaoAccessToken = jest
        .fn()
        .mockImplementationOnce(async () => ({ access_token: '' }));
      oauthUtil.getKakaoUserInfo = jest
        .fn()
        .mockImplementationOnce(async () => ({
          userInfo: {
            kakao_account: {
              email: emailStub,
              profile: { nickname: nicknameStub },
            },
          },
        }));

      const { status, body } = await request(app.getHttpServer())
        .get('/oauth/kakao-login')
        .query({ code: '' });

      expect(status).toBe(HttpStatus.OK);
      expect(typeof body.access_token).toBe('string');
      expect(typeof body.refresh_token).toBe('string');
    });
  });

  describe('카카오 인증을 받지 못해 실패한다.', () => {
    it('401 예외를 던진다.', async () => {
      oauthUtil.getKakaoAccessToken = jest
        .fn()
        .mockImplementationOnce(async () => {
          throw new UnauthorizedException();
        });

      const { status } = await request(app.getHttpServer())
        .get('/oauth/kakao-login')
        .query({ code: '' });

      expect(status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('400 예외를 던진다.', async () => {
      oauthUtil.getKakaoAccessToken = jest
        .fn()
        .mockImplementationOnce(async () => {
          throw new BadRequestException();
        });

      const { status } = await request(app.getHttpServer())
        .get('/oauth/kakao-login')
        .query({ code: '' });

      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('이메일 동의를 하지 않아 실패한다.', () => {
    it('400 예외를 던진다.', async () => {
      const nicknameStub = 'test';
      oauthUtil.getKakaoAccessToken = jest
        .fn()
        .mockImplementationOnce(async () => ({ access_token: '' }));
      oauthUtil.getKakaoUserInfo = jest
        .fn()
        .mockImplementationOnce(async () => ({
          userInfo: {
            kakao_account: {
              email: null,
              profile: { nickname: nicknameStub },
            },
          },
        }));

      const { status, body } = await request(app.getHttpServer())
        .get('/oauth/kakao-login')
        .query({ code: '' });

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toBe('Please Agree to share your email');
    });
  });
});
