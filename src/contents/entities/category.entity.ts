import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Collection } from 'src/collections/entities/collection.entity';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Content } from './content.entity';

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
}
