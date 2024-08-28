import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../domain/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/category.entity';
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
    description: 'Article Reminder Date(YYYY-MM-DD HH:mm:ss)',
    required: false,
  })
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  reminder?: Date;

  @ApiProperty({ description: 'Favorite' })
  @Column({ default: false })
  @IsBoolean()
  favorite?: boolean;

  @ApiProperty({ description: 'Article Category', required: false })
  @ManyToOne(() => Category, (category) => category.contents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId', referencedColumnName: 'id' })
  category?: Category;

  @ManyToOne(() => User, (user) => user.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @ApiProperty({ description: 'Owner ID' })
  @RelationId((content: Content) => content.user)
  userId: number;
}
