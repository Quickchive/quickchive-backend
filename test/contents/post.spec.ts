import { HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { getBuilder } from '../common/application-builder';
import { JwtAuthGuard } from '../../src/auth/jwt/jwt.guard';
import { jwtAuthGuardMock } from '../mock/jwt-auth-guard.mock';
import { UserSeeder } from '../seeder/user.seeder';
import { User } from '../../src/users/entities/user.entity';
import { AddContentBodyDto } from '../../src/contents/dtos/content.dto';
import { faker } from '@faker-js/faker';

jest.setTimeout(30_000);
describe('[POST] /api/contents', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;

  // Seeder
  const userSeeder: UserSeeder = new UserSeeder();

  // userStub
  const userStub = userSeeder.generateOne({ id: 1 });

  // userRepository
  let userRepository: Repository<User>;

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
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock(userStub))
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

  describe('콘텐츠를 추가한다.', () => {
    beforeEach(async () => {
      await userRepository.save(userStub);
    });
    it('201을 반환한다.', async () => {
      const addContentDto: AddContentBodyDto = {
        link: faker.internet.url(),
        title: faker.lorem.sentence(),
        comment: faker.lorem.paragraph(),
      };

      const { status } = await request(app.getHttpServer())
        .post('/contents')
        .send(addContentDto);

      expect(status).toBe(HttpStatus.CREATED);
    });
  });

  describe('유저가 존재하지 않아 실패한다.', () => {
    it('404 예외를 던진다.', async () => {
      const addContentDto: AddContentBodyDto = {
        link: faker.internet.url(),
        title: faker.lorem.sentence(),
        comment: faker.lorem.paragraph(),
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/contents')
        .send(addContentDto);

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body.message).toBe('User not found');
    });
  });
});
