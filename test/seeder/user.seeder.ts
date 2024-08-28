import { Seeder } from './seeder.interface';
import { User, UserRole } from '../../src/domain/user/entities/user.entity';
import { faker } from '@faker-js/faker';

export class UserSeeder implements Seeder<User> {
  private readonly userStub = {
    id: faker.number.int({ min: 1, max: 9999 }),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    name: faker.person.lastName(),
    email: faker.internet.email(),
    profileImage: faker.internet.url(),
    password:
      '1' +
      faker.internet.password({
        length: 10,
        // pattern: /^(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
      }),
    role: UserRole.Client,
    verified: true,
    contents: [],
  };

  generateOne(options?: Partial<User>): User {
    return { ...this.userStub, ...options } as User;
  }
}
