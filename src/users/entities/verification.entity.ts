import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne, BeforeInsert } from 'typeorm';
import { User } from './user.entity';
// import { CoreEntity } from 'src/common/entities/core.entity';
import { CoreEntity } from '../../common/entities/core.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Verification extends CoreEntity {
  @ApiProperty({ description: 'Authentication code' })
  @Column()
  code: string;

  @OneToOne((type) => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode(): void {
    this.code = uuidv4();
  }
}
