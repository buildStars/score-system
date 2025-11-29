import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsIn, Min } from 'class-validator';

export class CreateBetDto {
  @ApiProperty({ description: '期号', example: '3330421' })
  @IsString()
  @IsNotEmpty({ message: '期号不能为空' })
  issue: string;

  @ApiProperty({ description: '下注类型：multiple=倍数, big=大, small=小, odd=单, even=双, big_odd=大单, big_even=大双, small_odd=小单, small_even=小双', example: 'multiple' })
  @IsString()
  @IsIn(['multiple', 'big', 'small', 'odd', 'even', 'big_odd', 'big_even', 'small_odd', 'small_even'], { message: '下注类型不合法' })
  betType: string;

  @ApiProperty({ description: '下注内容：倍数下注时为倍数值(如1000)，其他类型为对应的中文(如"大"、"小单"等)', example: '1000' })
  @IsString()
  @IsNotEmpty({ message: '下注内容不能为空' })
  betContent: string;

  @ApiProperty({ description: '下注金额', example: 1000 })
  @IsNumber()
  @Min(1, { message: '下注金额至少为1' })
  amount: number;
}



