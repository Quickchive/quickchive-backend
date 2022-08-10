// collection entity

import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Content } from 'src/contents/entities/content.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

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
    type: [Content],
    required: false,
  })
  @ManyToMany((type) => Content, {
    nullable: true,
  })
  @JoinTable()
  contents?: Content[];

  @ApiProperty({ description: 'Collection Order' })
  @Column('int', { array: true, nullable: true })
  order?: number[];

  @ManyToOne((type) => User, (user) => user.collections, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((content: Content) => content.user)
  userId: number;
}
