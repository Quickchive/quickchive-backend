import { AuthGuard } from '@nestjs/passport';
import { getBuilder } from '../common/application-builder';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { googleAuthGuardMock } from '../mock/google-auth-guard.mock';

const emailStub = 'test@email.com';
const nameStub = 'test';
const accessTokenStub = 'testToken';

jest.setTimeout(30_000);
describe('[GET] /api/oauth/google-auth', () => {
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
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('구글 계정 로그인 요청에 성공한다.', () => {
    it('302를 반환한다.', async () => {
      const { status } = await request(app.getHttpServer()).get(
        '/oauth/google-auth',
      );

      expect(status).toBe(HttpStatus.FOUND);
    });
  });
});
