import { Injectable, BadRequestException, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LotteryCountdownService } from '../lottery/lottery-countdown.service';
import { UpdateBetSettingsDto } from './dto/update-bet-settings.dto';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { ClearDataDto } from './dto/clear-data.dto';
import { UpdateBetTypeSettingDto, BatchUpdateBetTypeSettingsDto } from './dto/bet-type-setting.dto';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LotteryCountdownService))
    private countdownService: LotteryCountdownService,
  ) {}

  /**
   * 获取下注设置
   */
  async getBetSettings() {
    const settings = await this.prisma.betSetting.findMany();
    
    const result: any = {};
    settings.forEach((setting) => {
      const key = this.convertKeyToCamelCase(setting.settingKey);
      const value = setting.valueType === 'number' 
        ? parseFloat(setting.settingValue) 
        : setting.settingValue;
      
      // 直接返回值，不包装成对象
      result[key] = value;
    });

    return result;
  }

  /**
   * 更新下注设置
   */
  async updateBetSettings(
    updateDto: UpdateBetSettingsDto,
    adminId: number,
    adminUsername: string,
  ) {
    const updates: any[] = [];

    for (const [key, value] of Object.entries(updateDto)) {
      if (value !== undefined) {
        const settingKey = this.convertCamelCaseToSnakeCase(key);
        updates.push(
          this.prisma.betSetting.update({
            where: { settingKey },
            data: { settingValue: value.toString() },
          }),
        );
      }
    }

    await this.prisma.$transaction([
      ...updates,
      this.prisma.adminLog.create({
        data: {
          adminId,
          adminUsername,
          action: 'update_bet_settings',
          resourceType: 'setting',
          description: '更新下注设置',
          requestData: JSON.parse(JSON.stringify(updateDto)),
        },
      }),
    ]);

    return { message: '下注设置更新成功' };
  }

  /**
   * 获取系统设置
   */
  async getSystemSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    
    const result: any = {};
    settings.forEach((setting) => {
      const key = this.convertKeyToCamelCase(setting.settingKey);
      let value: any = setting.settingValue;
      
      if (setting.valueType === 'boolean') {
        value = setting.settingValue === 'true';
      } else if (setting.valueType === 'number') {
        value = parseFloat(setting.settingValue);
      }
      
      // 直接返回值，不包装成对象
      result[key] = value;
    });

    return result;
  }

  /**
   * 更新系统设置
   */
  async updateSystemSettings(
    updateDto: UpdateSystemSettingsDto,
    adminId: number,
    adminUsername: string,
  ) {
    const updates: any[] = [];

    // 过滤掉已废弃的字段（由后端配置文件或其他方式管理）
    const deprecatedFields = ['warningTime', 'lotteryDataSource'];

    for (const [key, value] of Object.entries(updateDto)) {
      if (value !== undefined && !deprecatedFields.includes(key)) {
        const settingKey = this.convertCamelCaseToSnakeCase(key);
        // 所有值都转换为字符串（数据库中 settingValue 是 String 类型）
        const settingValue = String(value);
        
        // 使用 upsert：如果存在则更新，不存在则创建
        updates.push(
          this.prisma.systemSetting.upsert({
            where: { settingKey },
            update: { settingValue },
            create: { 
              settingKey, 
              settingName: key, // 配置名称
              settingValue,
              valueType: 'string',
              description: `动态配置: ${key}`,
            },
          }),
        );
      }
    }

    await this.prisma.$transaction([
      ...updates,
      this.prisma.adminLog.create({
        data: {
          adminId,
          adminUsername,
          action: 'update_system_settings',
          resourceType: 'setting',
          description: '更新系统设置',
          requestData: JSON.parse(JSON.stringify(updateDto)),
        },
      }),
    ]);

    // 检查是否更新了封盘相关配置，如果是则刷新倒计时服务
    const timingKeys = ['drawInterval', 'closeBeforeDraw'];
    const hasTimingUpdate = Object.keys(updateDto).some(key => 
      timingKeys.includes(key)
    );
    
    if (hasTimingUpdate) {
      try {
        await this.countdownService.refresh();
        console.log('✅ 封盘配置已刷新');
      } catch (error) {
        console.error('刷新封盘配置失败:', error.message);
      }
    }

    return { message: '系统设置更新成功' };
  }

  /**
   * 清空数据（不包括用户积分）
   */
  async clearData(
    clearDataDto: ClearDataDto,
    adminId: number,
    adminUsername: string,
  ) {
    const { startDate, endDate, clearBets, clearPointRecords, clearLotteryHistory } = clearDataDto;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('开始日期必须小于结束日期');
    }

    const deletedCounts: any = {
      bets: 0,
      pointRecords: 0,
      lotteryHistory: 0,
    };

    await this.prisma.$transaction(async (tx) => {
      // 清空下注记录
      if (clearBets !== false) {
        const result = await tx.bet.deleteMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            status: { in: ['win', 'loss', 'cancelled'] }, // 只删除已结算的
          },
        });
        deletedCounts.bets = result.count;
      }

      // 清空积分记录
      if (clearPointRecords === true) {
        const result = await tx.pointRecord.deleteMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        });
        deletedCounts.pointRecords = result.count;
      }

      // 清空开奖历史
      if (clearLotteryHistory === true) {
        const result = await tx.lotteryResult.deleteMany({
          where: {
            drawTime: {
              gte: start,
              lte: end,
            },
            isSettled: 1, // 只删除已结算的开奖记录
          },
        });
        deletedCounts.lotteryHistory = result.count;
      }

      // 记录管理员操作
      await tx.adminLog.create({
        data: {
          adminId,
          adminUsername,
          action: 'clear_data',
          description: `清空数据: ${startDate} 至 ${endDate}`,
          requestData: clearDataDto as any,
        },
      });
    });

    return {
      message: '数据清空成功',
      deletedBets: deletedCounts.bets,
      deletedPointRecords: deletedCounts.pointRecords,
      deletedLotteryHistory: deletedCounts.lotteryHistory,
    };
  }

  /**
   * 驼峰转下划线
   */
  private convertCamelCaseToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * 下划线转驼峰
   */
  private convertKeyToCamelCase(str: string): string {
    return str.replace(/_./g, (match) => match[1].toUpperCase());
  }

  // ==================== 下注类型配置管理 ====================

  /**
   * 获取所有下注类型配置
   */
  async getBetTypeSettings() {
    return await this.prisma.betTypeSetting.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 获取指定下注类型配置
   */
  async getBetTypeSetting(betType: string) {
    const setting = await this.prisma.betTypeSetting.findUnique({
      where: { betType },
    });

    if (!setting) {
      throw new NotFoundException(`下注类型 ${betType} 不存在`);
    }

    return setting;
  }

  /**
   * 更新指定下注类型配置
   */
  async updateBetTypeSetting(
    betType: string,
    updateDto: UpdateBetTypeSettingDto,
    adminId: number,
    adminUsername: string,
  ) {
    // 验证配置是否存在
    const existing = await this.prisma.betTypeSetting.findUnique({
      where: { betType },
    });

    if (!existing) {
      throw new NotFoundException(`下注类型 ${betType} 不存在`);
    }

    // 验证金额范围
    if (updateDto.minBet !== undefined && updateDto.maxBet !== undefined) {
      if (updateDto.minBet > updateDto.maxBet) {
        throw new BadRequestException('最小投注额不能大于最大投注额');
      }
    }

    // 验证费率范围
    if (updateDto.feeRate !== undefined && (updateDto.feeRate < 0 || updateDto.feeRate > 1)) {
      throw new BadRequestException('手续费比例必须在 0-1 之间');
    }

    // 更新配置
    const updated = await this.prisma.betTypeSetting.update({
      where: { betType },
      data: updateDto,
    });

    // 记录日志
    await this.prisma.adminLog.create({
      data: {
        adminId,
        adminUsername,
        action: 'update_bet_type_setting',
        resourceType: 'bet_type_setting',
        resourceId: betType,
        description: `更新下注类型配置: ${existing.name}`,
        requestData: JSON.parse(JSON.stringify(updateDto)),
      },
    });

    return updated;
  }

  /**
   * 批量更新下注类型配置
   */
  async batchUpdateBetTypeSettings(
    batchUpdateDto: BatchUpdateBetTypeSettingsDto,
    adminId: number,
    adminUsername: string,
  ) {
    const results = [];

    for (const item of batchUpdateDto.settings) {
      const { betType, ...updateData } = item;
      
      try {
        const updated = await this.updateBetTypeSetting(
          betType,
          updateData,
          adminId,
          adminUsername,
        );
        results.push({
          betType,
          success: true,
          data: updated,
        });
      } catch (error) {
        results.push({
          betType,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      message: '批量更新完成',
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}

