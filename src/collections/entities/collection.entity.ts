// collection entity
import { ApiProperty } from '@nestjs/swagger';
import { CoreEntity } from '../../common/entities/core.entity';
import { NestedContent } from './nested-content.entity';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from '../../contents/entities/category.entity';

@Entity()
export class Collection extends CoreEntity {
  @ApiProperty({ description: 'Collection Title' })
  @Column()
  title!: string;

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

  @ApiProperty({ description: 'Collection Category', required: false })
  @ManyToOne((type) => Category, (category) => category.collections, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ApiProperty({ description: 'Collection Order' })
  @Column('int', { array: true, nullable: true })
  order?: number[];

  @ApiProperty({ description: 'Favorite' })
  @Column({ default: false })
  favorite!: boolean;

  @ManyToOne((type) => User, (user) => user.collections, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((collection: Collection) => collection.user)
  userId!: number;
}
