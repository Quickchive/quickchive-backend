import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
// import { CoreEntity } from 'src/common/entities/core.entity';
import { CoreEntity } from '../../common/entities/core.entity';
// import { User } from 'src/users/entities/user.entity';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';
import { Transform } from 'class-transformer';

@Entity()
export class Content extends CoreEntity {
  @ApiProperty({ example: 'ex.com', description: 'Article Link' })
  @Column()
  @IsString({ message: 'String URL must be required.' })
  @IsUrl()
  link!: string;

  @ApiProperty({ description: 'Article Title', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Article Site Name', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiProperty({ description: 'Article Cover Image', required: false })
  @Column({ nullable: true })
  coverImg?: string;

  @ApiProperty({ description: 'Article Description', required: false })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ description: 'User Comment', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    example: '2022-08-20',
    description: 'Article Deadline(YYYY-MM-DD HH:mm:ss)',
    required: false,
  })
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  deadline?: Date;

  @ApiProperty({ description: 'Favorite' })
  @Column({ default: false })
  @IsBoolean()
  favorite!: boolean;

  @ApiProperty({ description: 'Flag indicating read' })
  @Column({ default: false })
  @IsBoolean()
  readFlag!: boolean;

  @ApiProperty({ description: 'Article Category', required: false })
  @ManyToOne((type) => Category, (category) => category.contents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ManyToOne((type) => User, (user) => user.contents, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((content: Content) => content.user)
  userId!: number;
}
