import { IsOptional, IsString, isURL, IsUrl, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';

@Entity()
export class Content extends CoreEntity {
  @ApiProperty()
  @Column()
  @IsString({ message: 'Must be a string!' })
  @IsUrl({ message: 'Link is not valid.' })
  link: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @ManyToOne((type) => Category, (category) => category.contents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ManyToOne((type) => User, (user) => user.contents, {
    onDelete: 'CASCADE',
  })
  user: User;

  @RelationId((content: Content) => content.user)
  userId: number;
}
