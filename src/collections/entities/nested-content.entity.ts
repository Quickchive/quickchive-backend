import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Collection } from './collection.entity';

@Entity()
export class NestedContent extends CoreEntity {
  @ApiProperty({ example: 'ex.com', description: 'Nested Content Link' })
  @Column()
  @IsString({ message: 'String URL must be required.' })
  @IsUrl()
  link: string;

  @ApiProperty({ description: 'Nested Content Title', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Nested Content Cover Image', required: false })
  @Column({ nullable: true })
  @IsString()
  coverImg?: string;

  @ApiProperty({ description: 'Nested Content Description', required: false })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  // @ApiProperty({ description: 'User Comment', required: false })
  // @Column({ nullable: true })
  // @IsOptional()
  // @IsString()
  // comment?: string;

  @ManyToOne((type) => Collection, (collection) => collection.contents, {
    onDelete: 'CASCADE',
  })
  collection: Collection;
}
