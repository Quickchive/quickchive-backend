import { faker } from '@faker-js/faker';
import { Category } from '../../src/categories/category.entity';
import { Seeder } from './seeder.interface';

export class CategorySeeder implements Seeder<Category> {
  private readonly categoryStub: Partial<Category> = {
    id: faker.number.int({ min: 1, max: 9999 }),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    name: faker.string.sample({ min: 2, max: 15 }),
    slug: faker.string.sample({ min: 2, max: 15 }),
    user: undefined,
    userId: undefined,
  };

  generateOne(options?: Partial<Category>): Category {
    return { ...this.categoryStub, ...options } as Category;
  }
}
