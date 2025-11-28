import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { LotteryModule } from '../lottery/lottery.module';

@Module({
  imports: [LotteryModule],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}

