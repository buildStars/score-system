import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StatisticsQueryDto {
  @ApiProperty({ description: '开始日期', example: '2024-11-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ description: '结束日期', example: '2024-11-30' })
  @IsNotEmpty()
  @IsString()
  endDate: string;
}



