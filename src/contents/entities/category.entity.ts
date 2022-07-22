import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Content } from './content.entity';

@Entity()
export class Category extends CoreEntity {
  @Column({ unique: true })
  @IsString()
  @Length(2)
  name: string;

  @Column({ unique: true })
  @IsString()
  slug: string;

  @OneToMany((type) => Content, (content) => content.category)
  contents: Content[];
}
