import { Module } from '@nestjs/common';
import { BetController } from './bet.controller';
import { BetService } from './bet.service';
import { LotteryModule } from '../lottery/lottery.module';

@Module({
  imports: [LotteryModule],
  controllers: [BetController],
  providers: [BetService],
  exports: [BetService],
})
export class BetModule {}

