import { Module } from '@nestjs/common';
import { BetController } from './bet.controller';
import { BetService } from './bet.service';
import { LotteryModule } from '../lottery/lottery.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [LotteryModule, TelegramModule],
  controllers: [BetController],
  providers: [BetService],
  exports: [BetService],
})
export class BetModule {}

