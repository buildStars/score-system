import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LotteryController } from './lottery.controller';
import { LotteryService } from './lottery.service';
import { LotteryCountdownService } from './lottery-countdown.service';
import { LotterySyncService } from './lottery-sync.service';

@Module({
  imports: [HttpModule],
  controllers: [LotteryController],
  providers: [LotteryService, LotteryCountdownService, LotterySyncService],
  exports: [LotteryService, LotteryCountdownService, LotterySyncService],
})
export class LotteryModule {}

