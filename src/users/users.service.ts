import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadPersonalContentsOutput } from './dtos/load-personal-contents.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}
  async loadPersonalContents(user: User): Promise<LoadPersonalContentsOutput> {
    try {
      const { contents } = await this.users.findOne({
        where: { id: user.id },
        relations: {
          contents: {
            category: true,
          },
        },
      });

      return {
        ok: true,
        contents,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not load Contents',
      };
    }
  }
}
