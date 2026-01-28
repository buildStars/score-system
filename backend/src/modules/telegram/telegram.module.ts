import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramUserClientService } from './telegram-user-client.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramUserClientService],
  exports: [TelegramService, TelegramUserClientService],
})
export class TelegramModule {}


