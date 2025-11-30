import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMessageDto {
  @ApiPropertyOptional({ description: '状态：unread=未读, read=已读, replied=已回复', example: 'unread' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '搜索关键词（姓名/联系方式/留言内容）', example: '张三' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}

