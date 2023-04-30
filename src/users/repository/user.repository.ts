import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';

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

  async findOneWithCategoriesOrFail(id: number): Promise<User> {
    return await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.categories', 'categories')
      .where('user.id = :id', { id })
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
}
