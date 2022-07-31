import { ApiProperty } from '@nestjs/swagger';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class RefreshToken extends CoreEntity {
  @ApiProperty({ description: 'Refresh Token' })
  @Column()
  refreshToken: string;

  @ApiProperty({ description: 'User Id' })
  @Column()
  userId: number;
}
