import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class ClearDataDto {
  @ApiProperty({ description: '开始日期', example: '2024-11-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ description: '结束日期', example: '2024-11-30' })
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty({ description: '是否清空下注记录', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  clearBets?: boolean;

  @ApiProperty({ description: '是否清空积分记录', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  clearPointRecords?: boolean;

  @ApiProperty({ description: '是否清空开奖历史', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  clearLotteryHistory?: boolean;
}

