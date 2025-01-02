import { AuthGuard } from '@nestjs/passport';
import { getBuilder } from '../common/application-builder';
import { CACHE_MANAGER, HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { googleAuthGuardMock } from '../mock/google-auth-guard.mock';
import { cacheManagerMock } from '../mock/cache-manager.mock';

const emailStub = 'test@email.com';
const nameStub = 'test';
const accessTokenStub = 'testToken';

jest.setTimeout(30_000);
describe('[GET] /api/oauth/google-login', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;

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
      .overrideGuard(AuthGuard('google'))
      .useValue(
        googleAuthGuardMock({
          email: emailStub,
          name: nameStub,
          accessToken: accessTokenStub,
        }),
      )
      .overrideProvider(CACHE_MANAGER)
      .useValue(cacheManagerMock)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('구글 로그인에 성공한다', () => {
    it('토큰과 함께 200을 반환한다.', async () => {
      const { status, body } = await request(app.getHttpServer()).get(
        '/oauth/google-login',
      );

      console.log(body);

      expect(status).toBe(HttpStatus.OK);
      expect(typeof body.access_token).toBe('string');
      expect(typeof body.refresh_token).toBe('string');
    });
  });
});
