import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BetModule } from './modules/bet/bet.module';
import { LotteryModule } from './modules/lottery/lottery.module';
import { PointModule } from './modules/point/point.module';
import { SystemModule } from './modules/system/system.module';
import { AdminModule } from './modules/admin/admin.module';
import { MessageModule } from './modules/message/message.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // 定时任务模块
    ScheduleModule.forRoot(),
    
    // 数据库模块
    PrismaModule,
    
    // 业务模块
    AuthModule,
    UserModule,
    BetModule,
    LotteryModule,
    PointModule,
    SystemModule,
    AdminModule,
    MessageModule,
  ],
})
export class AppModule {}
