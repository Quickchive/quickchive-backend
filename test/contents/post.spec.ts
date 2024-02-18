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
import { Category } from '../../src/categories/category.entity';
import { CategorySeeder } from '../seeder/category.seeder';

jest.setTimeout(30_000);
describe('[POST] /api/contents', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;

  // Seeder
  const userSeeder: UserSeeder = new UserSeeder();
  const categorySeeder = new CategorySeeder();

  // userStub
  const userStub = userSeeder.generateOne({ id: 1 });
  let categoryStub: Category;

  // userRepository
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;

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
    categoryRepository = dataSource.getRepository(Category);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('카테고리와 함께 콘텐츠를 추가한다.', () => {
    beforeEach(async () => {
      await userRepository.save(userStub);
    });

    describe('카테고리가 없어 새로 생성한다.', () => {
      it('201을 반환한다.', async () => {
        const addContentDto: AddContentBodyDto = {
          link: faker.internet.url(),
          title: faker.lorem.sentence(),
          comment: faker.lorem.paragraph(),
          categoryName: faker.string.sample({ min: 2, max: 15 }),
        };

        const { status } = await request(app.getHttpServer())
          .post('/contents')
          .send(addContentDto);

        expect(status).toBe(HttpStatus.CREATED);
      });
    });

    describe('기존 카테고리와 함께 콘텐츠를 추가한다.', () => {
      beforeEach(async () => {
        await userRepository.save(userStub);
        categoryStub = categorySeeder.generateOne({
          user: userStub,
          userId: userStub.id,
        });
        await categoryRepository.save(categoryStub);
      });

      it('201을 반환한다.', async () => {
        const addContentDto: AddContentBodyDto = {
          link: faker.internet.url(),
          title: faker.lorem.sentence(),
          comment: faker.lorem.paragraph(),
          categoryName: categoryStub.name,
        };

        const { status } = await request(app.getHttpServer())
          .post('/contents')
          .send(addContentDto);

        expect(status).toBe(HttpStatus.CREATED);
      });
    });
  });

  describe('카테고리 없이 콘텐츠를 추가한다.', () => {
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
