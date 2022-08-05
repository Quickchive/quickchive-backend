import { IsDate, IsOptional, IsString, IsUrl } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';
import { Transform } from 'class-transformer';

@Entity()
export class Content extends CoreEntity {
  @ApiProperty({ example: 'ex.com', description: 'Article Link' })
  @Column()
  @IsString({ message: 'String URL must be required.' })
  @IsUrl()
  link: string;

  @ApiProperty({ description: 'Article Title', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Article Cover Image', required: false })
  @Column({ nullable: true })
  @IsString()
  coverImg?: string;

  @ApiProperty({ description: 'Article Description', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'User Comment', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    example: '2022-08-20T15:00:00.000Z',
    description: 'Article Deadline(YYYY-MM-DD HH:mm:ss)',
    required: false,
  })
  @Column({ nullable: true })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  deadline?: Date;

  @ApiProperty({ description: 'Favorite' })
  @Column({ default: false })
  favorite: boolean;

  @ApiProperty({ description: 'Article Category', required: false })
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
