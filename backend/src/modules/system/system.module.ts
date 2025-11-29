import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemInitService } from './system-init.service';
import { LotteryModule } from '../lottery/lottery.module';

@Module({
  imports: [LotteryModule],
  controllers: [SystemController],
  providers: [SystemService, SystemInitService],
  exports: [SystemService],
})
export class SystemModule {}

