import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, MinLength, MaxLength, Min } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'user003' })
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

  @ApiProperty({ description: '昵称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname?: string;

  @ApiProperty({ description: '初始积分', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: '积分不能为负数' })
  points?: number;
}



