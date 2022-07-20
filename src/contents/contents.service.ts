import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AddContentBodyDto, AddContentOutput } from './dtos/content.dto';
import { Category } from './entities/category.entity';
import { Content } from './entities/content.entity';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private readonly contents: Repository<Content>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async addContent(
    user: User,
    { link, title, description, comment }: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    try {
      if (!link) {
        throw new Error('Missing required field.');
      }

      const newContent = this.contents.create({
        link,
        title,
        description,
        comment,
      });
      newContent.user = user;
      await this.contents.save(newContent);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not add Content',
      };
    }
  }
}
