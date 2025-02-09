import { InternalServerErrorException } from '@nestjs/common';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IsBoolean, IsEmail, IsEnum, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Content } from '../../contents/entities/content.entity';
import { Category } from '../../categories/category.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { CoreEntity } from '../../common/entities/core.entity';
import { PaidPlan } from './paid-plan.entity';
import { PROVIDER } from '../constant/provider.constant';

export enum UserRole {
  Client = 'Client',
  Admin = 'Admin',
}

@Entity()
export class User extends CoreEntity {
  @ApiProperty({ example: 'tester', description: 'User Name' })
  @Column()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ex@g.com', description: 'User Email' })
  @Column({ type: 'varchar' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://ex.com', description: 'User Profile Image' })
  @Column({ nullable: true })
  @IsString()
  profileImage?: string;

  @ApiProperty({ example: 'passw0rd', description: 'User Password' })
  @Column({ select: false })
  @IsString({ message: 'Password is required' })
  @Matches(/^(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must be at least 8 characters long, contain 1 number',
  })
  password: string;

  @ApiProperty({
    example: 'Client',
    description: 'User Role',
    enum: Object.values(UserRole),
  })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.Client })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ type: 'enum', enum: PROVIDER })
  provider: PROVIDER;

  @ApiProperty({ description: 'User Verified' })
  @Column({ default: false })
  @IsBoolean()
  verified: boolean;

  @ApiProperty({
    description: 'User Content List',
    type: [Content],
    required: false,
  })
  @OneToMany(() => Content, (content) => content.user, {
    nullable: true,
  })
  contents?: Content[];

  @ApiProperty({
    description: 'User Category List',
    type: [Category],
    required: false,
  })
  @OneToMany(() => Category, (category) => category.user, {
    nullable: true,
  })
  categories?: Category[];

  @ApiProperty({
    description: 'User Content List',
    type: [Content],
    required: false,
  })
  @OneToMany((type) => Collection, (collection) => collection.user, {
    nullable: true,
  })
  collections?: Collection[];

  @ApiProperty({
    description: 'User Plan',
    type: PaidPlan,
    required: false,
  })
  @ManyToOne((type) => PaidPlan, (paidPlan) => paidPlan.users, {
    nullable: true,
  })
  paidPlan?: PaidPlan;

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

  static of({
    email,
    name,
    profileImage,
    password,
    provider,
  }: {
    email: string;
    name: string;
    profileImage?: string;
    password: string;
    provider: PROVIDER;
  }): User {
    const user = new User();
    user.email = email;
    user.name = name;
    user.profileImage = profileImage;
    user.password = password;
    user.provider = provider;

    return user;
  }
}
