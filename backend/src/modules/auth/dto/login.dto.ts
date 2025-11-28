import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'user001' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(20, { message: '密码最多20个字符' })
  password: string;
}

export class AdminLoginDto extends LoginDto {
  @ApiProperty({ description: '管理员用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '管理员密码', example: 'admin123' })
  password: string;
}



