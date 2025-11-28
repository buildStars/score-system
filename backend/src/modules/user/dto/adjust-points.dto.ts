import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({ description: '调整金额（正数=增加，负数=减少）', example: 500 })
  @IsNumber()
  @IsNotEmpty({ message: '金额不能为空' })
  amount: number;

  @ApiProperty({ description: '备注', example: '管理员充值' })
  @IsString()
  @IsNotEmpty({ message: '备注不能为空' })
  remark: string;
}



