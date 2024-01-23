import { CACHE_MANAGER, HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { User } from '../../src/users/entities/user.entity';
import { Seeder } from '../seeder/seeder.interface';
import { UserSeeder } from '../seeder/user.seeder';
import { getBuilder } from '../common/application-builder';
import { cacheManagerMock } from '../mock/cache-manager.mock';
import { customJwtService } from '../../src/auth/jwt/jwt.service';
import { customJwtServiceMock } from '../mock/custom-jwt-service.mock';
import { MailService } from '../../src/mail/mail.service';
import { mailServiceMock } from '../mock/mail-service.mock';
import * as request from 'supertest';

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
      .overrideProvider(MailService)
      .useValue(mailServiceMock)
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
   * 1. 이메일 전송에 성공한다.
   * 2. 유저가 존재하지 않아 실패한다.
   * 3. 유저가 인증되지 않아 실패한다.
   */

  describe('이메일 전송에 성공한다.', () => {
    beforeEach(async () => {
      userStub = userSeeder.generateOne({ verified: true });
      await userRepository.save(userStub);
    });

    it('빈 응답과 함께 201을 반환한다.', async () => {
      const emailParam = userStub.email;

      const { status, body } = await request(app.getHttpServer()).post(
        `/auth/send-password-reset-email/${emailParam}`,
      );

      expect(status).toBe(HttpStatus.CREATED);
    });
  });
});
