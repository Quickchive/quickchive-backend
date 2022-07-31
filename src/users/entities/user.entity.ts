import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Content } from 'src/contents/entities/content.entity';
import { Category } from 'src/contents/entities/category.entity';

export enum UserRole {
  Client = 'Client',
  Admin = 'Admin',
}

@Injectable()
@Entity()
export class User extends CoreEntity {
  @ApiProperty({ example: 'tester', description: 'User Name' })
  @Column()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ex@g.com', description: 'User Email' })
  @Column({ unique: true })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'p@ssw0rd', description: 'User Password' })
  @Column({ select: false })
  @IsString()
  password: string;

  @ApiProperty({ example: 'Client', description: 'User Role' })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.Client })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'User Verified' })
  @Column({ default: false })
  @IsBoolean()
  verified: boolean;

  @ApiProperty({ description: 'User Content List', type: [Content] })
  @OneToMany((type) => Content, (content) => content.user, {
    nullable: true,
  })
  contents?: Content[];

  @ApiProperty({ description: 'User Category List', type: [Category] })
  @ManyToMany((type) => Category, {
    nullable: true,
  })
  @JoinTable()
  categories?: Category[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, this.password);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
