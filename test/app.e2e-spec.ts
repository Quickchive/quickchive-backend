import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // beforeEach(async () => {
  //   const moduleFixture: TestingModule = await Test.createTestingModule({
  //     imports: [AppModule],
  //   }).compile();

  //   app = moduleFixture.createNestApplication();
  //   await app.init();
  // });
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // tip: access the database connection via
    // const connection = app.get(Connection)
    // const a = connection.manager
  });

  afterAll(async () => {
    await Promise.all([app.close()]);
  });

  describe('Authentication', () => {
    let jwtToken: string;

    it('authenticates user with valid credentials and provides a jwt token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@gmail.com', password: 'p@ssw0rd' })
        .expect(201);

      // set jwt token for use in subsequent tests
      jwtToken = response.body.access_token;
      expect(jwtToken).toMatch(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
      ); // jwt regex
    });

    it('fails to authenticate user with an incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@gmail.com', password: 'wrong_password' })
        .expect(400);

      expect(response.body.accessToken).not.toBeDefined();
    });

    // assume test data does not include a nobody@example.com user
    it('fails to authenticate user that does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'test' })
        .expect(404);

      expect(response.body.message).toEqual('User Not Found');
      expect(response.body.accessToken).not.toBeDefined();
    });

    it('/contents/load-contents (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/contents/load-contents')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(typeof response.body.contents).toEqual('object');
    });

    it('/contents/load-favorites (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/contents/load-favorites')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(typeof response.body.favorite_contents).toEqual('object');
    });
  });
});
