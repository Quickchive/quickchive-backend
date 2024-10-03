import { CACHE_MANAGER, HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { User } from '../../src/domain/user/entities/user.entity';
import { Seeder } from '../seeder/seeder.interface';
import { UserSeeder } from '../seeder/user.seeder';
import { getBuilder } from '../common/application-builder';
import { cacheManagerMock } from '../mock/cache-manager.mock';
import { customJwtService } from '../../src/auth/jwt/jwt.service';
import * as request from 'supertest';
import { customJwtServiceMock } from '../mock/custom-jwt-service.mock';

jest.setTimeout(30_000);
describe('[POST] /api/auth/logout', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;
  let cacheManager: Cache;
  let jwtService: customJwtService;

  // Repository
  let userRepository: Repository<User>;

  // Seeder
  const userSeeder: Seeder<User> = new UserSeeder();

  // Stub
  let userStub: User = userSeeder.generateOne({ id: 1 }); // auto increment이므로 1로 적용.

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
      .overrideProvider(customJwtService)
      .useValue(customJwtServiceMock)
      .compile();

    app = module.createNestApplication();
    await app.init();

    userRepository = dataSource.getRepository(User);
    cacheManager = app.get(CACHE_MANAGER);
    jwtService = app.get(customJwtService);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  /**
   * 1. token 재발급에 성공한다.
   * 2. 유효하지 않은 refresh token으로 실패한다.
   * 3. 캐시에 저장된 토큰이 없어 실패한다.
   * 4. 유저가 존재하지 않아 실패한다.
   */

  describe('token 재발급에 성공한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne();
      await userRepository.save(userStub);
    });

    it('access token 및 refresh token과 함께 201을 반환한다.', async () => {
      jwtService.verify = jest.fn().mockImplementationOnce(() => ({
        sub: userStub.id,
      }));
      jwtService.sign = jest.fn().mockImplementationOnce(() => 'accessToken');
      cacheManager.get = jest
        .fn()
        .mockImplementationOnce(async () => 'tokenStub');
      jwtService.generateRefreshToken = jest
        .fn()
        .mockImplementationOnce(async () => 'refreshToken');

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/token')
        .send({ refresh_token: 'tokenStub' });

      expect(status).toBe(HttpStatus.CREATED);
      expect(body.access_token).toBe('accessToken');
      expect(body.refresh_token).toBe('refreshToken');
    });
  });

  describe('유효하지 않은 refresh token으로 실패한다.', () => {
    it('401 예외를 던진다.', async () => {
      jwtService.verify = jest.fn().mockImplementationOnce(() => {
        throw new Error();
      });

      const { status, body } = await request(app.getHttpServer()).post(
        '/auth/token',
      );

      expect(status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.message).toBe('Invalid refresh token');
    });
  });

  describe('캐시에 저장된 토큰이 없어 실패한다.', () => {
    it('404 예외를 던진다.', async () => {
      cacheManager.get = jest.fn().mockResolvedValue(null);

      const { status, body } = await request(app.getHttpServer()).post(
        '/auth/token',
      );

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBe('There is no refresh token');
    });
  });

  describe('유저가 존재하지 않아 실패한다.', () => {
    it('404 예외를 던진다.', async () => {
      jwtService.verify = jest
        .fn()
        .mockImplementationOnce(() => ({ sub: userStub.id }));
      cacheManager.get = jest.fn().mockResolvedValue('tokenStub');

      const { status, body } = await request(app.getHttpServer()).post(
        '/auth/token',
      );

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBe('User not found');
    });
  });
});
