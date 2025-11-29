import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({ description: '调整金额（正数=增加，负数=减少）', example: 500 })
  @IsNumber()
  @IsNotEmpty({ message: '金额不能为空' })
  amount: number;

  @ApiProperty({ description: '备注（可选）', example: '管理员充值', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}



