import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangeAdminPasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 32 })
  @IsString()
  @MinLength(6, { message: '新密码长度不能少于6位' })
  @MaxLength(32, { message: '新密码长度不能超过32位' })
  newPassword: string;
}

