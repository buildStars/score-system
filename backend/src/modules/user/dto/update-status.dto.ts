import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ description: '状态：1=正常 2=禁用 3=冻结', example: 1 })
  @IsInt()
  @IsIn([1, 2, 3], { message: '状态值必须是1、2或3' })
  status: number;
}



