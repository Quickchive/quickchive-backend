import { DataSource, EntityManager, Repository } from 'typeorm';
import { Content } from '../entities/content.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentRepository extends Repository<Content> {
  constructor(private readonly dataSource: DataSource) {
    super(Content, dataSource.createEntityManager());
  }

  async findByCategoryId(id: number): Promise<Content[]> {
    return this.createQueryBuilder('content')
      .where('content.categoryId = :categoryId', { categoryId: id })
      .getMany();
  }

  async findWithCategories(id: number): Promise<Content[]> {
    return this.createQueryBuilder('content')
      .where('content.userId = :userId', { userId: id })
      .leftJoinAndSelect('content.category', 'category')
      .getMany();
  }

  async findWhereFavoriteWithCategories(id: number): Promise<Content[]> {
    return this.createQueryBuilder('content')
      .where('content.userId = :userId', { userId: id })
      .andWhere('content.favorite = :favorite', { favorite: true })
      .leftJoinAndSelect('content.category', 'category')
      .getMany();
  }

  async GetCountWhereReminderIsNotNull(id: number): Promise<number> {
    return this.createQueryBuilder('content')
      .where('content.userId = :userId', { userId: id })
      .andWhere('content.reminder IS NOT NULL')
      .getCount();
  }

  async GetCountWhereReminderIsPast(id: number): Promise<number> {
    return this.createQueryBuilder('content')
      .where('content.userId = :userId', { userId: id })
      .andWhere('content.reminder IS NOT NULL')
      .andWhere('content.reminder < :now', { now: new Date() })
      .getCount();
  }

  async createOne(
    content: Content,
    entityManager?: EntityManager,
  ): Promise<Content> {
    return entityManager ? entityManager.save(content) : this.save(content);
  }

  async updateOne(content: Partial<Content>, entityManager?: EntityManager) {
    return entityManager
      ? entityManager.update(Content, { id: content.id }, content)
      : this.update({ id: content.id }, content);
  }
}
