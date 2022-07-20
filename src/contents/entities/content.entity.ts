import { IsString, IsUrl, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Content extends CoreEntity {
  @ApiProperty()
  @Column()
  @IsString({ message: 'Must be a string!' })
  @IsUrl(undefined, { message: 'Link is not valid.' })
  link: string;

  @Column()
  @IsString()
  title: string;

  @Column()
  @IsString()
  description: string;

  @Column()
  @IsString()
  comment: string;

  @ManyToOne((type) => User, (user) => user.contents, {
    onDelete: 'CASCADE',
  })
  user: User;

  @RelationId((content: Content) => content.user)
  userId: number;
}
