import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateBetSettingsDto {
  @ApiProperty({ description: '倍数手续费比例', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  multipleFeeRate?: number;

  @ApiProperty({ description: '倍数手续费基数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  multipleFeeBase?: number;

  @ApiProperty({ description: '组合手续费比例', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comboFeeRate?: number;

  @ApiProperty({ description: '组合手续费基数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  comboFeeBase?: number;

  @ApiProperty({ description: '最小下注金额', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minBetAmount?: number;

  @ApiProperty({ description: '最大下注金额', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxBetAmount?: number;

  @ApiProperty({ description: '单期最大下注次数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxBetsPerIssue?: number;

  @ApiProperty({ description: '不回本损失比例', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Min(1)
  multipleLossRate?: number;
}



