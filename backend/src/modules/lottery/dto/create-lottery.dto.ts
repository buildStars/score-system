import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateLotteryDto {
  @ApiProperty({ description: '期号', example: '20240101001' })
  @IsString()
  issue: string;

  @ApiProperty({ description: '第一个号码 (0-9)', example: 3 })
  @IsInt()
  @Min(0)
  @Max(9)
  number1: number;

  @ApiProperty({ description: '第二个号码 (0-9)', example: 5 })
  @IsInt()
  @Min(0)
  @Max(9)
  number2: number;

  @ApiProperty({ description: '第三个号码 (0-9)', example: 7 })
  @IsInt()
  @Min(0)
  @Max(9)
  number3: number;
}








