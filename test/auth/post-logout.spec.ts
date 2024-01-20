import { CACHE_MANAGER, HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Seeder } from '../seeder/seeder.interface';
import { UserSeeder } from '../seeder/user.seeder';
import { getBuilder } from '../common/application-builder';
import { cacheManagerMock } from '../mock/cache-manager.mock';
import { JwtAuthGuard } from '../../src/auth/jwt/jwt.guard';
import { jwtAuthGuardMock } from '../mock/jwt-auth-guard.mock';
import { LogoutBodyDto } from '../../src/auth/dtos/login.dto';
import { Cache } from 'cache-manager';
import * as request from 'supertest';

jest.setTimeout(30_000);
describe('[POST] /api/auth/logout', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;
  let cacheManager: Cache;

  // Repository
  let userRepository: Repository<User>;

  // Seeder
  const userSeeder: Seeder<User> = new UserSeeder();

  // Stub
  let userStub: User = userSeeder.generateOne({ id: 1 });

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
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock(userStub))
      .compile();

    app = module.createNestApplication();
    await app.init();

    userRepository = dataSource.getRepository(User);
    cacheManager = app.get(CACHE_MANAGER);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  /**
   * 1. 로그아웃에 성공한다.
   * 2. 유저가 존재하지 않아 실패한다.
   * 3. refresh token이 body에 존재하지 않아 실패한다.
   * 4. refresh token이 캐시에 존재하지 않아 실패한다.
   * 5. refresh token 캐시 값이 userId와 일치하지 않아 실패한다.
   */

  describe('로그아웃에 성공한다', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne({ id: userStub.id });
      await userRepository.save(userStub);
    });

    it('빈 객체와 함께 201을 반환한다.', async () => {
      const logoutDto: LogoutBodyDto = {
        refresh_token: '123',
      };
      cacheManager.get = jest.fn().mockImplementationOnce(() => userStub.id);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/logout')
        .send(logoutDto);

      expect(status).toBe(HttpStatus.CREATED);
    });
  });

  describe('유저가 존재하지 않아 실패한다.', () => {
    it('404 예외를 던진다.', async () => {
      const logoutDto: LogoutBodyDto = {
        refresh_token: '123',
      };
      cacheManager.get = jest.fn().mockImplementationOnce(() => userStub.id);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/logout')
        .send(logoutDto);

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBe('User not found');
    });
  });

  describe('refresh token이 body에 존재하지 않아 실패한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne({ id: userStub.id });
      await userRepository.save(userStub);
    });

    it('400 예외를 던진다', async () => {
      const logoutDto: LogoutBodyDto = {
        refresh_token: '',
      };
      cacheManager.get = jest
        .fn()
        .mockImplementationOnce(() => userStub.id + 1);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/logout')
        .send(logoutDto);

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toBe('Refresh token is required');
    });
  });

  describe('refresh token이 캐시에 존재하지 않아 실패한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne({ id: userStub.id });
      await userRepository.save(userStub);
    });

    it('400 예외를 던진다.', async () => {
      const logoutDto: LogoutBodyDto = {
        refresh_token: '123',
      };
      cacheManager.get = jest.fn().mockImplementationOnce(() => undefined);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/logout')
        .send(logoutDto);

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBe('Refresh token not found');
    });
  });

  describe('refresh token 캐시 값이 userId와 일치하지 않아 실패한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne({ id: userStub.id });
      await userRepository.save(userStub);
    });

    it('401 예외를 던진다.', async () => {
      const logoutDto: LogoutBodyDto = {
        refresh_token: '123',
      };
      cacheManager.get = jest
        .fn()
        .mockImplementationOnce(() => userStub.id + 1);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/logout')
        .send(logoutDto);

      expect(status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBe('Invalid refresh token');
    });
  });
});
