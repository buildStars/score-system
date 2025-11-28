import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BetTypeSettingDto {
  @ApiProperty({ description: '下注类型' })
  @IsString()
  betType: string;

  @ApiProperty({ description: '显示名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '赔率' })
  @IsNumber()
  @Min(0)
  odds: number;

  @ApiProperty({ description: '最小投注额' })
  @IsNumber()
  @Min(0)
  minBet: number;

  @ApiProperty({ description: '最大投注额' })
  @IsNumber()
  @Min(0)
  maxBet: number;

  @ApiProperty({ description: '手续费比例（0-1之间）' })
  @IsNumber()
  @Min(0)
  @Max(1)
  feeRate: number;

  @ApiProperty({ description: '是否启用' })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '说明' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBetTypeSettingDto {
  @ApiPropertyOptional({ description: '显示名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '赔率' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odds?: number;

  @ApiPropertyOptional({ description: '最小投注额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBet?: number;

  @ApiPropertyOptional({ description: '最大投注额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBet?: number;

  @ApiPropertyOptional({ description: '手续费比例（0-1之间）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  feeRate?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '说明' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BetTypeSettingItemDto extends UpdateBetTypeSettingDto {
  @ApiProperty({ description: '下注类型' })
  @IsString()
  betType: string;
}

export class BatchUpdateBetTypeSettingsDto {
  @ApiProperty({ description: '下注类型设置列表', type: [BetTypeSettingItemDto] })
  @ValidateNested({ each: true })
  @Type(() => BetTypeSettingItemDto)
  settings: BetTypeSettingItemDto[];
}

