import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Content } from '../contents/entities/content.entity';
import { CoreEntity } from '../common/entities/core.entity';
import { Collection } from '../collections/entities/collection.entity';
import { User } from '../users/entities/user.entity';

export enum IconName {
  None = 'None',
  Trip = 'Trip',
  Game = 'Game',
  Book = 'Book',
  Document = 'Document',
  Shopping = 'Shopping',
  Gift = 'Gift',
  Folder = 'Folder',
  Star = 'Star',
  Cake = 'Cake',
  Cafe = 'Cafe',
  Cook = 'Cook',
  Watch = 'Watch',
}

@Entity()
export class Category extends CoreEntity {
  @ApiProperty({ description: 'Category Name' })
  @Column()
  @IsString()
  @Length(2)
  name!: string;

  @ApiProperty({ description: 'Category Slug' })
  @Column()
  @IsString()
  slug!: string;

  @OneToMany((type) => Content, (content) => content.category)
  contents!: Content[];

  @Column({ type: 'enum', enum: IconName, default: IconName.None })
  @IsEnum(IconName)
  iconName!: IconName;

  @OneToMany((type) => Collection, (collection) => collection.category)
  collections!: Collection[];

  @ApiProperty({ description: 'Category Parent ID', example: 1, type: Number })
  @Column({ type: 'int', nullable: true })
  parentId?: number | null;

  @ManyToOne((type) => User, (user) => user.categories, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user!: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((category: Category) => category.user)
  userId!: number;
}
