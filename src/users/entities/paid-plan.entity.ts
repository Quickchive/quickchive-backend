import { Column, Entity, OneToMany } from 'typeorm';
import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from './user.entity';

@Entity()
export class PaidPlan extends CoreEntity {
  @ApiProperty({ example: 'ultimate', description: 'plan name' })
  @Column({ unique: true })
  @IsString()
  name!: string;

  @ApiProperty({ example: 3000, description: 'plan price' })
  @Column()
  @IsNumber()
  price!: number;

  @ApiProperty({
    example: 30,
    description: 'The period (in days) of the paid plan.',
  })
  @Column()
  @IsString()
  duration_days!: number;

  @ApiProperty({ example: 'ultimate plan', description: 'plan description' })
  @Column()
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Users in use', type: [User] })
  @OneToMany((type) => User, (user) => user.paidPlan, {
    nullable: true,
  })
  users?: User[];
}
