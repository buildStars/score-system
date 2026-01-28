import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateSystemSettingsDto {
  @ApiProperty({ description: '网站标题', required: false })
  @IsOptional()
  @IsString()
  siteTitle?: string;

  @ApiProperty({ description: '网站副标题', required: false })
  @IsOptional()
  @IsString()
  siteSubtitle?: string;

  @ApiProperty({ description: '游戏开启状态', required: false })
  @IsOptional()
  @IsBoolean()
  gameEnabled?: boolean;

  @ApiProperty({ description: '维护模式', required: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiProperty({ description: '系统公告', required: false })
  @IsOptional()
  @IsString()
  systemNotice?: string;

  @ApiProperty({ description: '开奖数据源（已废弃，由后端配置文件管理）', required: false })
  @IsOptional()
  @IsString()
  lotteryDataSource?: string;

  @ApiProperty({ description: '自动结算开关', required: false })
  @IsOptional()
  @IsBoolean()
  autoSettleEnabled?: boolean;

  @ApiProperty({ description: '开奖间隔时间（秒）', required: false, example: 210 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(600)
  drawInterval?: number;

  @ApiProperty({ description: '封盘时间（开奖前多少秒封盘，0表示不封盘）', required: false, example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  closeBeforeDraw?: number;

  @ApiProperty({ description: '封盘预警时间（已废弃，保留以兼容旧数据）', required: false })
  @IsOptional()
  @IsNumber()
  warningTime?: number;

  // ==================== Telegram 配置 ====================

  @ApiProperty({ description: 'Telegram 通知开关', required: false })
  @IsOptional()
  @IsString()
  telegram_enabled?: string;

  @ApiProperty({ description: 'Telegram Bot Token', required: false })
  @IsOptional()
  @IsString()
  telegram_bot_token?: string;

  @ApiProperty({ description: 'Telegram Chat ID', required: false })
  @IsOptional()
  @IsString()
  telegram_chat_id?: string;

  @ApiProperty({ description: 'Telegram 上报汇率（金额除以此值后上报）', required: false })
  @IsOptional()
  @IsString()
  telegram_rate?: string;

  @ApiProperty({ description: 'Telegram 倍数取整方式（round=四舍五入, floor=向下, ceil=向上）', required: false })
  @IsOptional()
  @IsString()
  telegram_multiple_round?: string;

  @ApiProperty({ description: 'Telegram 组合取整方式（round=四舍五入, floor=向下, ceil=向上）', required: false })
  @IsOptional()
  @IsString()
  telegram_combo_round?: string;

  // ==================== Telegram 用户账号配置 ====================

  @ApiProperty({ description: 'Telegram 用户账号启用开关', required: false })
  @IsOptional()
  @IsString()
  telegram_user_enabled?: string;

  @ApiProperty({ description: 'Telegram 用户账号 API ID', required: false })
  @IsOptional()
  @IsString()
  telegram_user_api_id?: string;

  @ApiProperty({ description: 'Telegram 用户账号 API Hash', required: false })
  @IsOptional()
  @IsString()
  telegram_user_api_hash?: string;

  @ApiProperty({ description: 'Telegram 用户账号手机号', required: false })
  @IsOptional()
  @IsString()
  telegram_user_phone?: string;

  @ApiProperty({ description: 'Telegram 用户账号目标 Chat ID', required: false })
  @IsOptional()
  @IsString()
  telegram_user_chat_id?: string;

  @ApiProperty({ description: 'Telegram 用户账号 Session（自动保存，无需手动配置）', required: false })
  @IsOptional()
  @IsString()
  telegram_user_session?: string;

  // ==================== 久旺机器人配置 ====================

  @ApiProperty({ description: '久旺机器人启用开关', required: false })
  @IsOptional()
  @IsString()
  telegram_jiuwang_enabled?: string;

  @ApiProperty({ description: '久旺机器人 Bot Token', required: false })
  @IsOptional()
  @IsString()
  telegram_jiuwang_bot_token?: string;

  @ApiProperty({ description: '久旺机器人 Chat ID', required: false })
  @IsOptional()
  @IsString()
  telegram_jiuwang_chat_id?: string;
}

