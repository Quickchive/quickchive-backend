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

  // Create Account By OAuth User Info and Return User and number
  /**
   *
   * @param userInfo
   * @returns User, number(0: not existed, 1: existed)
   */
  async getOrCreateAccount(
    userInfo: GetOrCreateAccountBodyDto,
  ): Promise<{ user: User; exist: number }> {
    try {
      const { email, name, profileImage, password } = userInfo;
      let user = await this.findOneBy({
        email,
      });
      let exist = 1;
      if (!user) {
        exist = 0;
        user = await this.save(
          this.create({
            email,
            name,
            profileImage,
            password,
            verified: true,
          }),
        );
      }

      return { user, exist };
    } catch (e) {
      throw e;
    }
  }
}
