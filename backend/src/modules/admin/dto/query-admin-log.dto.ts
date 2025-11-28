import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdminLogDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: '管理员ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminId?: number;

  @ApiProperty({ description: '操作类型', required: false })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}



