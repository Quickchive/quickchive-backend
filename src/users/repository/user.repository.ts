import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { GetOrCreateAccountBodyDto } from '../dtos/get-or-create-account.dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findOneWithContents(id: number): Promise<User | null> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.contents', 'content')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findOneWithCategories(id: number): Promise<User | null> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.categories', 'categories')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findOneWithCategoriesOrFail(id: number): Promise<User> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.categories', 'categories')
      .where('user.id = :id', { id })
      .orderBy('categories.createdAt', 'DESC')
      .getOneOrFail();
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

  async createOne(user: Partial<User>): Promise<User> {
    return this.save(user);
  }
}
