import { faker } from '@faker-js/faker';
import { Content } from '../../src/contents/entities/content.entity';
import { Seeder } from './seeder.interface';

export class ContentSeeder implements Seeder<Content> {
  private readonly contentStub: Partial<Content> = {
    id: faker.number.int({ min: 1, max: 9999 }),
    link: faker.internet.url(),
    title: faker.lorem.slug(),
    siteName: faker.internet.domainName(),
    coverImg: faker.image.url(),
    description: faker.lorem.paragraph(),
    comment: faker.lorem.paragraph(),
    reminder: faker.date.recent(),
    favorite: faker.datatype.boolean(),
    user: undefined,
    userId: undefined,
  };

  generateOne(options?: Partial<Content>): Content {
    return { ...this.contentStub, ...options } as Content;
  }
}
