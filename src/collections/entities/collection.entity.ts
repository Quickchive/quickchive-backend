// collection entity

import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CoreEntity } from 'src/common/entities/core.entity';
import { NestedContent } from './nested-content.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';

@Injectable()
@Entity()
export class Collection extends CoreEntity {
  @ApiProperty({ description: 'Collection Title' })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Collection Comment',
    required: false,
  })
  @Column({ nullable: true })
  comment?: string;

  @ApiProperty({
    description: 'Content List in Collection',
    type: [NestedContent],
    required: false,
  })
  @OneToMany(
    (type) => NestedContent,
    (nestedContent) => nestedContent.collection,
    {
      nullable: true,
    },
  )
  contents?: NestedContent[];

  @ApiProperty({ description: 'Collection Order' })
  @Column('int', { array: true, nullable: true })
  order?: number[];

  @ManyToOne((type) => User, (user) => user.collections, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((collection: Collection) => collection.user)
  userId: number;
}
