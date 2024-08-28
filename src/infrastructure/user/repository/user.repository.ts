import { DataSource, Repository } from 'typeorm';
import { User } from '../../../domain/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/user/user.repository';

@Injectable()
export class UserRepositoryImpl
  extends Repository<User>
  implements UserRepository
{
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<User | null> {
    return this.findById(id);
  }

  async findByIdWithContents(id: number): Promise<User | null> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.contents', 'content')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByIdWithCategories(id: number): Promise<User | null> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.categories', 'categories')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByIdWithCategoriesOrFail(id: number): Promise<User> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.categories', 'categories')
      .where('user.id = :id', { id })
      .orderBy('categories.createdAt', 'DESC')
      .getOneOrFail();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findOneWithContentsAndCategories(id: number): Promise<User | null> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.contents', 'content')
      .leftJoinAndSelect('content.category', 'content_category')
      .leftJoinAndSelect('user.categories', 'category')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async createOne(user: User): Promise<User> {
    return this.save(user);
  }

  async deleteById(id: number): Promise<void> {
    await this.delete(id);
  }
}
