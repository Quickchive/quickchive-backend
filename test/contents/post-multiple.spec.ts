import { HttpStatus, INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { getBuilder } from '../common/application-builder';
import { JwtAuthGuard } from '../../src/auth/jwt/jwt.guard';
import { jwtAuthGuardMock } from '../mock/jwt-auth-guard.mock';
import { UserSeeder } from '../seeder/user.seeder';
import { User } from '../../src/users/entities/user.entity';
import { AddMultipleContentsBodyDto } from '../../src/contents/dtos/content.dto';
import { faker } from '@faker-js/faker';
import { Category } from '../../src/categories/category.entity';
import { CategorySeeder } from '../seeder/category.seeder';
import { Content } from '../../src/contents/entities/content.entity';
import { ContentSeeder } from '../seeder/content.seeder';

jest.setTimeout(30_000);
describe('[POST] /api/contents', () => {
  // Application
  let app: INestApplication;
  let container: StartedPostgreSqlContainer; // TODO 결합도 낮추기
  let dataSource: DataSource;

  // Seeder
  const userSeeder: UserSeeder = new UserSeeder();
  const categorySeeder = new CategorySeeder();
  const contentSeeder = new ContentSeeder();

  // userStub
  const userStub = userSeeder.generateOne({ id: 1 });
  let categoryStub: Category;
  let contentStub: Content;

  // userRepository
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let contentRepository: Repository<Content>;

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
    contentRepository = dataSource.getRepository(Content);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('콘텐츠를 추가한다.', () => {
    describe('카테고리 없이 추가한다.', () => {
      beforeEach(async () => {
        await userRepository.save(userStub);
      });
      it('201을 반환한다.', async () => {
        const addMultipleContentsBodyDto: AddMultipleContentsBodyDto = {
          contentLinks: [
            faker.internet.url(),
            faker.internet.url(),
            faker.internet.url(),
          ],
        };

        const { status } = await request(app.getHttpServer())
          .post('/contents/multiple')
          .send(addMultipleContentsBodyDto);

        expect(status).toBe(HttpStatus.CREATED);
      });
    });

    describe('카테고리와 함께 추가한다.', () => {
      beforeEach(async () => {
        await userRepository.save(userStub);
      });
      it('201을 반환한다.', async () => {
        const addMultipleContentsBodyDto: AddMultipleContentsBodyDto = {
          contentLinks: [
            faker.internet.url(),
            faker.internet.url(),
            faker.internet.url(),
          ],
          categoryName: faker.lorem.word(),
        };

        const { status } = await request(app.getHttpServer())
          .post('/contents/multiple')
          .send(addMultipleContentsBodyDto);

        expect(status).toBe(HttpStatus.CREATED);
      });
    });
  });

  describe('이미 등록한 콘텐츠이므로 실패한다.', () => {
    const link = faker.internet.url();

    beforeEach(async () => {
      await userRepository.save(userStub);
      categoryStub = categorySeeder.generateOne({
        user: userStub,
        userId: userStub.id,
      });
      await categoryRepository.save(categoryStub);
      contentStub = contentSeeder.generateOne({
        link,
        userId: userStub.id,
        category: categoryStub,
      });
      await contentRepository.save(contentStub);
      userStub.contents?.push(contentStub);
      await userRepository.save(userStub);
    });

    it('409 예외를 던진다.', async () => {
      const addMultipleContentsBodyDto: AddMultipleContentsBodyDto = {
        contentLinks: [link],
        categoryName: categoryStub.name,
      };

      const { status } = await request(app.getHttpServer())
        .post('/contents/multiple')
        .send(addMultipleContentsBodyDto);

      expect(status).toBe(HttpStatus.CONFLICT);
    });
  });
});
