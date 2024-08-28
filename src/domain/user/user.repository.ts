import { User } from './entities/user.entity';

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByIdWithContents(id: number): Promise<User | null>;
  findByIdWithCategories(id: number): Promise<User | null>;
  findByIdWithCategoriesOrFail(id: number): Promise<User>;
  findOneWithContentsAndCategories(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  createOne(user: User): Promise<User>;
  deleteById(id: number): Promise<void>;
}

export const UserRepository = Symbol('UserRepository');
