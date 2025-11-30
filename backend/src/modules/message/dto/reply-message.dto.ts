import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ReplyMessageDto {
  @ApiProperty({ description: '回复内容', example: '感谢您的咨询，我们会尽快与您联系' })
  @IsString()
  @IsNotEmpty({ message: '回复内容不能为空' })
  adminReply: string;
}

