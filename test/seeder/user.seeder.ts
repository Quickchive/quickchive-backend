import { Seeder } from './seeder.interface';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { faker } from '@faker-js/faker';

export class UserSeeder implements Seeder<User> {
  private readonly userStub = {
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
  };

  generateOne(options?: { [K in keyof User]: any }): User {
    return { ...this.userStub, ...options } as User;
  }
}
