import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryBetDto {
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

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiProperty({ description: '期号', required: false })
  @IsOptional()
  @IsString()
  issue?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: '下注类型', required: false })
  @IsOptional()
  @IsString()
  betType?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: '是否合并显示', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  merged?: boolean;
}

