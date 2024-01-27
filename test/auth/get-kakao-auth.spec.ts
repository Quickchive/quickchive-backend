import { getBuilder } from '../common/application-builder';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';

jest.setTimeout(30_000);
describe('[GET] /api/oauth/kakao-auth', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기

  beforeAll(async () => {
    const { builder, container: _container } = await getBuilder();
    container = _container;

    const module = await builder.compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  /**
   * 1. 카카오 계정 로그인 요청을 수행한다.
   */

  describe('카카오 계정 로그인 요청을 수락한다.', () => {
    it('redirect url로 이동하며 302를 반환한다.', async () => {
      const { status } = await request(app.getHttpServer()).get(
        '/oauth/kakao-auth',
      );

      expect(status).toBe(HttpStatus.FOUND);
    });
  });
});
