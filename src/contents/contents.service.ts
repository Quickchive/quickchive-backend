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

  async getOrCreateCategory(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.categories.findOneBy({ slug: categorySlug });

    if (!category) {
      category = await this.categories.save(
        this.categories.create({ slug: categorySlug, name: categoryName }),
      );
    }

    return category;
  }

  async addContent(
    user: User,
    { link, title, description, comment, categoryName }: AddContentBodyDto,
  ): Promise<AddContentOutput> {
    try {
      if (!link) {
        throw new Error('Missing required field.');
      }
      const category = categoryName
        ? await this.getOrCreateCategory(categoryName)
        : null;

      const newContent = this.contents.create({
        link,
        title,
        description,
        comment,
        category,
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
