import { getBuilder } from '../common/application-builder';
import { CACHE_MANAGER, HttpStatus, INestApplication } from '@nestjs/common';
import { cacheManagerMock } from '../mock/cache-manager.mock';
import { User } from '../../src/domain/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { Seeder } from '../seeder/seeder.interface';
import { LoginBodyDto } from '../../src/auth/dtos/login.dto';
import { UserSeeder } from '../seeder/user.seeder';
import * as bcrypt from 'bcrypt';

jest.setTimeout(30_000);
describe('[POST] /api/auth/login', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;

  // Repository
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
      .overrideProvider(CACHE_MANAGER)
      .useValue(cacheManagerMock)
      .compile();

    app = module.createNestApplication();
    await app.init();

    userRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('testHealthCheck', async () => {
    const { status, body } = await request(app.getHttpServer()).get('');

    expect(status).toBe(HttpStatus.OK);
    expect(body.data).toBe(true);
  });

  /**
   * 1. 로그인에 성공한다.
   * 2. 유저가 존재하지 않아 실패한다.
   * 3. 비밀번호가 일치하지 않아 실패한다.
   */

  describe('로그인에 성공한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne();
      const hashedPassword = await bcrypt.hash(userStub.password, 10);
      await userRepository.save({ ...userStub, password: hashedPassword });
    });

    it('access token 및 refresh token과 함께 201을 반환한다.', async () => {
      const loginBodyDto: LoginBodyDto = {
        email: userStub.email,
        password: userStub.password,
        auto_login: true,
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginBodyDto);

      expect(status).toBe(HttpStatus.CREATED);
      expect(typeof body.access_token).toBe('string');
      expect(typeof body.refresh_token).toBe('string');
    });
  });

  describe('유저가 존재하지 않아 실패한다.', () => {
    it('404 예외를 던진다.', async () => {
      const loginBodyDto: LoginBodyDto = {
        email: userStub.email,
        password: userStub.password,
        auto_login: true,
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginBodyDto);

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBe('User Not Found');
    });
  });

  describe('비밀번호가 일치하지 않아 실패한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne();
      await userRepository.save(userStub);
    });

    it('400 예외를 던진다.', async () => {
      const loginBodyDto: LoginBodyDto = {
        email: userStub.email,
        password: userStub.password + 'fail',
        auto_login: true,
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginBodyDto);

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toBe('Wrong Password');
    });
  });
});
