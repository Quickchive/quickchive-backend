import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Content } from './content.entity';
import { CoreEntity } from '../../common/entities/core.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Category extends CoreEntity {
  @ApiProperty({ description: 'Category Name' })
  @Column({ unique: true })
  @IsString()
  @Length(2)
  name: string;

  @ApiProperty({ description: 'Category Slug' })
  @Column({ unique: true })
  @IsString()
  slug: string;

  @OneToMany((type) => Content, (content) => content.category)
  contents: Content[];

  @OneToMany((type) => Collection, (collection) => collection.category)
  collections: Collection[];

  @Column({ nullable: true })
  parentId?: number;

  @ManyToOne((type) => User, (user) => user.categories, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((category: Category) => category.user)
  userId: number;
}
