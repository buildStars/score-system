import { ApiProperty } from '@nestjs/swagger';

export class LotteryStatusDto {
  @ApiProperty({ description: '当前期号' })
  currentPeriod: string;

  @ApiProperty({ description: '下期期号' })
  nextPeriod: string;

  @ApiProperty({ description: '当前期封盘时间（格式：YYYY-MM-DD HH:mm:ss）' })
  currentCloseTime: string;

  @ApiProperty({ description: '当前期开奖时间（格式：YYYY-MM-DD HH:mm:ss）' })
  currentDrawTime: string;

  @ApiProperty({ description: '服务器当前时间（格式：YYYY-MM-DD HH:mm:ss）' })
  serverTime: string;

  @ApiProperty({ description: '当前状态：open=开盘, closing=即将封盘, closed=已封盘' })
  status: 'open' | 'closing' | 'closed';

  @ApiProperty({ description: '是否可以下注' })
  canBet: boolean;

  // 以下字段保留以兼容旧版前端，但建议前端使用时间字段自己计算
  @ApiProperty({ description: '距离下次状态变化的秒数（兼容字段，建议前端自己计算）' })
  countdown: number;

  @ApiProperty({ description: '倒计时显示文本（兼容字段）' })
  countdownText: string;

  @ApiProperty({ description: '进度百分比（0-100，兼容字段）' })
  progressPercentage: number;
}

