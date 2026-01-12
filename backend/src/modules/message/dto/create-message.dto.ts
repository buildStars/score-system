import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: '姓名', example: '张三' })
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  @MaxLength(50, { message: '姓名最多50个字符' })
  name: string;

  @ApiProperty({ description: '联系方式（手机/微信/邮箱等）', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '联系方式不能为空' })
  @MaxLength(100, { message: '联系方式最多100个字符' })
  contact: string;

  @ApiProperty({ description: '留言内容', example: '我想咨询合作相关事宜' })
  @IsString()
  @IsNotEmpty({ message: '留言内容不能为空' })
  message: string;
}





