import { IsOptional, IsString, isURL, IsUrl, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';

@Entity()
export class Content extends CoreEntity {
  @ApiProperty({ example: 'ex.com', description: 'Article Link' })
  @Column()
  @IsString({ message: 'String URL must be required.' })
  @IsUrl()
  link: string;

  @ApiProperty({ description: 'Article Title' })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Article Cover Image' })
  @Column({ nullable: true })
  @IsString()
  coverImg?: string;

  @ApiProperty({ description: 'Article Description' })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'User Comment' })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'Article Category' })
  @ManyToOne((type) => Category, (category) => category.contents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ManyToOne((type) => User, (user) => user.contents, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((content: Content) => content.user)
  userId: number;
}
