import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LotteryController } from './lottery.controller';
import { LotteryService } from './lottery.service';
import { LotteryCountdownService } from './lottery-countdown.service';
import { LotterySyncService } from './lottery-sync.service';
import { LotteryDataSourceManager } from './services/lottery-data-source.manager';
import { USA28DataSource } from './data-sources/usa28.data-source';
import { JND28DataSource } from './data-sources/jnd28.data-source';
import { DatabaseDataSource } from './data-sources/database.data-source';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [HttpModule, TelegramModule],
  controllers: [LotteryController],
  providers: [
    LotteryService,
    LotteryCountdownService,
    LotterySyncService,
    LotteryDataSourceManager,
    USA28DataSource,
    JND28DataSource,
    DatabaseDataSource,
  ],
  exports: [LotteryService, LotteryCountdownService, LotterySyncService],
})
export class LotteryModule {}

