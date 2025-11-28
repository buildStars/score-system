import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsIn, Min } from 'class-validator';

export class CreateBetDto {
  @ApiProperty({ description: '期号', example: '3330421' })
  @IsString()
  @IsNotEmpty({ message: '期号不能为空' })
  issue: string;

  @ApiProperty({ description: '下注类型：multiple=倍数 combo=组合', example: 'multiple' })
  @IsString()
  @IsIn(['multiple', 'combo'], { message: '下注类型必须是multiple或combo' })
  betType: string;

  @ApiProperty({ description: '下注内容：倍数值 或 大/小/单/双/大单/大双/小单/小双', example: '1000' })
  @IsString()
  @IsNotEmpty({ message: '下注内容不能为空' })
  betContent: string;

  @ApiProperty({ description: '下注金额', example: 1000 })
  @IsNumber()
  @Min(1, { message: '下注金额至少为1' })
  amount: number;
}



