import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { CoreOutput } from '../../common/dtos/output.dto';

export class EditProfileOutput extends CoreOutput {}

export class EditProfileDto {
  @ApiProperty({ example: 'passw0rd', description: 'User Password' })
  @IsString({ message: 'Password is required' })
  @Matches(/^(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must be at least 8 characters long, contain 1 number',
  })
  password: string;

  @ApiProperty({ example: 'tester', description: 'User Name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '기존 비밀번호' })
  @IsString()
  @IsOptional()
  oldPassword?: string;
}
