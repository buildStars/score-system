import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SettleLotteryDto {
  @ApiProperty({ description: '期号', example: '3330421' })
  @IsNotEmpty()
  @IsString()
  issue: string;
}



