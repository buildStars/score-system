import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryLotteryDto } from './dto/query-lottery.dto';
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import {
  isReturn,
  getSizeResult,
  getOddEvenResult,
  getComboResult,
  parseLotteryNumbers,
  calculateMultipleBetResult,
  calculateComboBetResult,
  calculateBigSmallOddEvenResult,
  isBetContentMatched,
} from './utils/lottery-rules.util';
import axios from 'axios';
import * as https from 'https';
import { LotteryDataSourceManager } from './services/lottery-data-source.manager';

@Injectable()
export class LotteryService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private dataSourceManager: LotteryDataSourceManager,
  ) {}

  /**
   * 从多数据源同步开奖数据（带自动故障转移）
   */
  async syncLotteryData() {
    try {
      console.log('🎯 开始同步开奖数据（多数据源模式）...');

      // 1. 使用数据源管理器获取最新数据（自动故障转移）
      const result = await this.dataSourceManager.fetchLatestData();

      if (!result.success || !result.data) {
        throw new BadRequestException('所有数据源均失败，无法获取开奖数据');
      }

      console.log(`✅ 成功从 ${result.source} 获取 ${result.data.length} 条开奖记录 (${result.responseTime}ms)`);

      let syncedCount = 0;
      let latestIssue = '';
      let latestDrawTime: Date | null = null;

      // 2. 处理每条开奖记录
      for (const item of result.data) {
        try {
          // 检查是否已存在
          const existing = await this.prisma.lotteryResult.findUnique({
            where: { issue: item.issue },
          });

          if (existing) {
            console.log(`期号 ${item.issue} 已存在，跳过`);
            continue;
          }

          // 3. 判定是否回本
          const returnResult = isReturn(item.number1, item.number2, item.number3, item.sumValue);

          // 4. 计算大小单双
          const sizeResult = getSizeResult(item.sumValue);
          const oddEvenResult = getOddEvenResult(item.sumValue);
          const comboResult = getComboResult(item.sumValue);

          // 5. 保存开奖结果
          const lotteryResult = await this.prisma.lotteryResult.create({
            data: {
              issue: item.issue,
              number1: item.number1,
              number2: item.number2,
              number3: item.number3,
              resultSum: item.sumValue,
              isReturn: returnResult.isReturn ? 1 : 0,
              returnReason: returnResult.reason,
              sizeResult,
              oddEvenResult,
              comboResult,
              drawTime: item.drawTime,
              isSettled: 0,
            },
          });

          console.log(`✓ 成功保存期号 ${item.issue}: ${item.number1}+${item.number2}+${item.number3}=${item.sumValue} (来源: ${item.source})`);
          
          syncedCount++;
          latestIssue = item.issue;
          latestDrawTime = lotteryResult.drawTime;

        } catch (itemError) {
          console.error(`处理期号 ${item.issue} 失败:`, itemError.message);
          // 继续处理下一条
        }
      }

      // 9. 触发自动结算（针对最新一期）
      if (syncedCount > 0 && latestIssue) {
        const autoSettleEnabled = await this.getSystemSetting('auto_settle_enabled');
        if (autoSettleEnabled === 'true') {
          console.log(`触发自动结算: ${latestIssue}`);
          try {
            await this.autoSettle(latestIssue);
          } catch (settleError) {
            console.error('自动结算失败:', settleError.message);
          }
        }
      }

      const message = syncedCount > 0 
        ? `成功同步 ${syncedCount} 条开奖数据 (来源: ${result.source})`
        : '没有新的开奖数据';

      console.log(message);

      return {
        message,
        syncedCount,
        latestIssue,
        latestDrawTime,
        dataSource: result.source,
        totalRecords: result.data.length,
      };

    } catch (error) {
      console.error('同步开奖数据失败：', error);
      
      throw new HttpException(
        {
          message: '同步开奖数据失败',
          error: error.message,
        },
        500,
      );
    }
  }

  /**
   * 获取数据源健康状态
   */
  async getDataSourceHealth() {
    return await this.dataSourceManager.healthCheck();
  }


  /**
   * 获取当前期号信息
   */
  async getCurrentIssue(userId?: number) {
    // 获取最新一期开奖
    const lastResult = await this.prisma.lotteryResult.findFirst({
      orderBy: { drawTime: 'desc' },
    });

    // 获取系统公告和游戏状态
    const gameEnabled = await this.getSystemSetting('game_enabled');
    const systemNotice = await this.getSystemSetting('system_notice');

    // 获取用户积分（如果有userId）
    let userPoints = 0;
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      userPoints = Number(user?.points || 0);
    }

    // 计算下一期期号（简单递增）
    const currentIssue = lastResult ? lastResult.issue : '3330421';
    const nextIssue = (parseInt(currentIssue) + 1).toString();

    // 倒计时（暂时固定3分钟，实际应该根据开奖时间计算）
    const countdown = 180;

    return {
      currentIssue: nextIssue,
      nextIssue: (parseInt(nextIssue) + 1).toString(),
      countdown,
      lastResult: lastResult ? {
        issue: lastResult.issue,
        number1: lastResult.number1,
        number2: lastResult.number2,
        number3: lastResult.number3,
        resultSum: lastResult.resultSum,
        isReturn: lastResult.isReturn,
        returnReason: lastResult.returnReason,
        sizeResult: lastResult.sizeResult,
        oddEvenResult: lastResult.oddEvenResult,
        comboResult: lastResult.comboResult,
        drawTime: lastResult.drawTime,
      } : null,
      userPoints,
      gameEnabled: gameEnabled === 'true',
      systemNotice,
    };
  }

  /**
   * 获取开奖历史（直接从数据库读取，由定时任务自动同步）
   * 
   * 优势：
   * - 查询速度快
   * - 不依赖第三方API
   * - 用户体验好
   */
  async getLotteryHistory(query: QueryLotteryDto) {
    const { page, limit, issue } = query;
    const skip = (page - 1) * limit;
    
    console.log('从数据库获取开奖历史...');
    
    // 构建查询条件
    const where: any = {};
    if (issue) {
      where.issue = { contains: issue };
    }

    // 查询总数
    const total = await this.prisma.lotteryResult.count({ where });
    
    // 查询列表
    const list = await this.prisma.lotteryResult.findMany({
      where,
      skip,
      take: limit,
      orderBy: { drawTime: 'desc' },
      select: {
        id: true,
        issue: true,
        number1: true,
        number2: true,
        number3: true,
        resultSum: true,
        isReturn: true,
        returnReason: true,
        sizeResult: true,
        oddEvenResult: true,
        comboResult: true,
        drawTime: true,
        isSettled: true,
        settledAt: true,
        createdAt: true,
      },
    });

    console.log(`✓ 从数据库获取 ${list.length} 条开奖记录`);

    return {
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      dataSource: 'database',
    };
  }

  /**
   * 自动结算指定期号
   */
  async autoSettle(issue: string) {
    // 1. 获取开奖结果
    const lotteryResult = await this.prisma.lotteryResult.findUnique({
      where: { issue },
    });

    if (!lotteryResult) {
      throw new BadRequestException('开奖结果不存在');
    }

    if (lotteryResult.isSettled === 1) {
      return { message: '该期已结算', issue };
    }

    // 2. 获取下注设置
    const betSettings = await this.getBetSettings();
    
    // 2.1 获取所有下注类型配置（用于按类型获取准确费率）
    const betTypeSettings = await this.prisma.betTypeSetting.findMany();
    const betTypeSettingsMap = new Map(
      betTypeSettings.map(s => [s.betType, s])
    );

    // 3. 查询该期所有待结算的下注
    const pendingBets = await this.prisma.bet.findMany({
      where: { issue, status: 'pending' },
      include: { user: true },
    });

    if (pendingBets.length === 0) {
      // 没有待结算的下注，直接标记为已结算
      await this.prisma.lotteryResult.update({
        where: { issue },
        data: { isSettled: 1, settledAt: new Date() },
      });
      return { message: '该期无待结算下注', issue, settledBets: 0 };
    }

    // 4. 逐条结算下注
    let settledCount = 0;
    for (const bet of pendingBets) {
      try {
        await this.settleSingleBet(bet, lotteryResult, betSettings, betTypeSettingsMap);
        settledCount++;
      } catch (error) {
        console.error(`结算下注失败 [BetID: ${bet.id}]:`, error);
      }
    }

    // 5. 标记为已结算
    await this.prisma.lotteryResult.update({
      where: { issue },
      data: { isSettled: 1, settledAt: new Date() },
    });

    return {
      message: '结算成功',
      issue,
      settledBets: settledCount,
      totalBets: pendingBets.length,
    };
  }

  /**
   * 结算单个下注
   */
  private async settleSingleBet(
    bet: any, 
    lotteryResult: any, 
    betSettings: any, 
    betTypeSettingsMap: Map<string, any>
  ) {
    let settlementAmount: number;
    let fee: number;
    let status: 'win' | 'loss';
    
    // 判断下注类型
    const isBigSmallOddEven = ['大', '小', '单', '双'].includes(bet.betContent);
    const isReturn = lotteryResult.isReturn === 1;

    if (bet.betType === 'multiple') {
      // ⭐️ 倍数下注
      // 根据具体的 betType 获取对应的费率配置
      const betTypeSetting = betTypeSettingsMap.get('multiple');
      const multipleFeeRate = betTypeSetting 
        ? Number(betTypeSetting.feeRate) * 100  // 转换：0.0378 -> 3.78
        : betSettings.multipleFeeRate;  // 兜底使用通用费率
      
      const result = calculateMultipleBetResult(
        Number(bet.amount),
        isReturn,
        multipleFeeRate,  // 使用配置的费率
        betSettings.multipleFeeBase,
      );
      
      settlementAmount = result.settlementAmount;
      fee = result.fee;
      status = result.status;
    } 
    else if (isBigSmallOddEven) {
      // ⭐️ 大小单双
      const result = calculateBigSmallOddEvenResult(
        Number(bet.amount),
        bet.betContent,
        lotteryResult.resultSum,
        isReturn,
      );
      
      settlementAmount = result.settlementAmount;
      fee = 0;  // 大小单双不单独收手续费
      status = result.status;
    } 
    else {
      // ⭐️ 组合下注（大单/大双/小单/小双）
      // 根据具体的 betType 获取对应的费率配置
      const betTypeSetting = betTypeSettingsMap.get(bet.betType);
      const comboFeeRate = betTypeSetting 
        ? Number(betTypeSetting.feeRate) * 100  // 转换：0.105 -> 10.5
        : betSettings.comboFeeRate;  // 兜底使用通用费率
      
      const result = calculateComboBetResult(
        Number(bet.amount),
        bet.betContent,
        lotteryResult.resultSum,
        isReturn,
        comboFeeRate,  // 使用具体类型的费率
        betSettings.comboFeeBase,
      );
      
      settlementAmount = result.settlementAmount;
      fee = result.fee;
      status = result.status;
    }

    // 使用事务更新
    await this.prisma.$transaction(async (tx) => {
      // ⚠️ 重要：获取用户当前的最新积分（而不是下注时的积分）
      // 这样可以正确处理同一期多笔下注的情况
      const currentUser = await tx.user.findUnique({
        where: { id: bet.userId },
      });
      
      if (!currentUser) {
        throw new Error(`用户 ${bet.userId} 不存在`);
      }
      
      const currentPoints = Number(currentUser.points);
      
      // 计算结算后的最终积分：当前积分 + 结算分
      // settlementAmount 是结算分，表示相对于下注前的积分变化
      const finalPointsWithDecimal = currentPoints + settlementAmount;
      const finalPoints = Math.floor(finalPointsWithDecimal);  // 向下取整

      // 更新用户积分（只保存整数）
      await tx.user.update({
        where: { id: bet.userId },
        data: { 
          points: finalPoints,
        },
      });

      // 更新下注记录（确保小数精度）
      const resultAmountValue = Number(settlementAmount.toFixed(2));
      const feeValue = Number(fee.toFixed(2));
      
      console.log(`💾 结算存储: resultAmount=${resultAmountValue}, fee=${feeValue}`);
      
      await tx.bet.update({
        where: { id: bet.id },
        data: {
          status,
          resultAmount: resultAmountValue,  // 保留两位小数的 number
          fee: feeValue,  // 保留两位小数的 number
          pointsAfter: finalPoints,
          settledAt: new Date(),
        },
      });

      // 记录结算积分变动（结算分）
      await tx.pointRecord.create({
        data: {
          userId: bet.userId,
          type: status === 'win' ? 'win' : 'loss',
          amount: resultAmountValue,  // 保留两位小数的 number
          balanceBefore: currentPoints,  // 结算前的当前积分（整数）
          balanceAfter: finalPoints,  // 结算后积分（整数）
          relatedId: bet.id,
          relatedType: 'bet',
          remark: `期号${bet.issue}结算-${status === 'win' ? '赢' : '输'}(${bet.betType}:${bet.betContent})`,
          operatorType: 'system',
        },
      });
    });
  }

  /**
   * 获取下注设置
   */
  private async getBetSettings() {
    // 从 bet_type_settings 表获取配置
    const betTypeSettings = await this.prisma.betTypeSetting.findMany();
    
    // 将数组转换为对象映射
    const settingsMap: any = {};
    betTypeSettings.forEach((setting) => {
      settingsMap[setting.betType] = {
        feeRate: Number(setting.feeRate),
      };
    });

    // 获取倍数下注配置
    const multipleConfig = settingsMap['multiple'] || {};
    // 获取组合下注配置
    const comboConfig = settingsMap['big_odd'] || settingsMap['combo'] || {};

    // 转换 feeRate：0.03 (3%) -> 3, feeBase = 100
    return {
      multipleFeeRate: (multipleConfig.feeRate || 0.03) * 100,
      multipleFeeBase: 100,
      comboFeeRate: (comboConfig.feeRate || 0.05) * 100,
      comboFeeBase: 100,
      multipleLossRate: 0.8,
    };
  }

  /**
   * 获取系统设置
   */
  private async getSystemSetting(key: string): Promise<string> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });
    return setting?.settingValue || '';
  }

  /**
   * 测试USA28 API连接
   */
  async testUsa28Api() {
    const usa28ApiUrl = 'https://api.365kaik.com/api/v1/trend/getHistoryList';
    const params = {
      lotCode: '10029',
      pageSize: '1',
      pageNum: '0',
      t: Date.now().toString(),
    };

    const startTime = Date.now();
    
    try {
      console.log('测试USA28 API连接...');
      console.log('API地址:', usa28ApiUrl);
      console.log('参数:', params);
      
      // 忽略 SSL 证书验证
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
      
      const response = await axios.get(usa28ApiUrl, {
        params,
        timeout: 30000,
        httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log('API响应成功');
      console.log('响应时间:', responseTime, 'ms');
      console.log('响应状态:', response.status);
      console.log('响应数据:', JSON.stringify(response.data).substring(0, 200));

      return {
        success: true,
        message: 'USA28 API连接正常',
        responseTime: `${responseTime}ms`,
        status: response.status,
        dataPreview: response.data,
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.error('API测试失败');
      console.error('耗时:', responseTime, 'ms');
      
      let errorInfo: any = {
        success: false,
        message: 'USA28 API连接失败',
        responseTime: `${responseTime}ms`,
      };

      if (error.response) {
        errorInfo.httpStatus = error.response.status;
        errorInfo.httpStatusText = error.response.statusText;
        errorInfo.errorData = error.response.data;
      } else if (error.request) {
        errorInfo.error = '请求已发送但没有收到响应';
        errorInfo.possibleReasons = [
          '1. 服务器网络连接问题',
          '2. 防火墙阻止了外网访问',
          '3. DNS解析失败',
          '4. USA28 API服务暂时不可用',
        ];
      } else if (error.code === 'ECONNABORTED') {
        errorInfo.error = '请求超时（30秒）';
      } else {
        errorInfo.error = error.message;
      }

      console.error('错误详情:', errorInfo);
      return errorInfo;
    }
  }

  /**
   * 手动创建开奖数据
   */
  async createLottery(dto: CreateLotteryDto) {
    // 1. 检查期号是否已存在
    const existing = await this.prisma.lotteryResult.findUnique({
      where: { issue: dto.issue },
    });

    if (existing) {
      throw new BadRequestException(`期号 ${dto.issue} 已存在`);
    }

    // 2. 计算开奖结果
    const { number1, number2, number3 } = dto;
    const resultSum = number1 + number2 + number3;
    const sizeResult = getSizeResult(resultSum);
    const oddEvenResult = getOddEvenResult(resultSum);
    const comboResult = getComboResult(resultSum);
    const returnResult = isReturn(number1, number2, number3, resultSum);
    const isReturnValue = returnResult.isReturn;
    const returnReason = returnResult.reason;

    // 3. 创建开奖记录
    const lottery = await this.prisma.lotteryResult.create({
      data: {
        issue: dto.issue,
        number1,
        number2,
        number3,
        resultSum,
        sizeResult,
        oddEvenResult,
        comboResult,
        isReturn: isReturnValue ? 1 : 0,
        returnReason,
        drawTime: new Date(), // 使用当前时间
        isSettled: 0, // 未结算
      },
    });

    console.log(`✓ 手动创建开奖数据: 期号=${dto.issue}, 号码=${number1} ${number2} ${number3}, 总和=${resultSum}`);

    return {
      message: '创建成功',
      data: lottery,
    };
  }

  /**
   * 修改开奖数据
   * 注意：修改已结算的数据后，需要手动重新结算该期号
   */
  async updateLottery(issue: string, dto: UpdateLotteryDto) {
    // 1. 检查期号是否存在
    const existing = await this.prisma.lotteryResult.findUnique({
      where: { issue },
    });

    if (!existing) {
      throw new BadRequestException(`期号 ${issue} 不存在`);
    }

    // 2. 计算新的开奖结果
    const { number1, number2, number3 } = dto;
    const resultSum = number1 + number2 + number3;
    const sizeResult = getSizeResult(resultSum);
    const oddEvenResult = getOddEvenResult(resultSum);
    const comboResult = getComboResult(resultSum);
    const returnResult = isReturn(number1, number2, number3, resultSum);
    const isReturnValue = returnResult.isReturn;
    const returnReason = returnResult.reason;

    // 3. 更新开奖记录，并重置结算状态
    const lottery = await this.prisma.lotteryResult.update({
      where: { issue },
      data: {
        number1,
        number2,
        number3,
        resultSum,
        sizeResult,
        oddEvenResult,
        comboResult,
        isReturn: isReturnValue ? 1 : 0,
        returnReason,
        // 如果已结算，重置结算状态（需要重新结算）
        isSettled: 0,
        settledAt: null,
      },
    });

    // 4. 如果该期号已经结算过，撤销之前的结算结果
    if (existing.isSettled === 1) {
      console.log(`⚠️ 期号 ${issue} 已结算，需要撤销旧结算并重新结算`);
      
      // 撤销该期号的所有结算记录（将状态改回 pending）
      await this.prisma.bet.updateMany({
        where: {
          issue,
          status: { in: ['win', 'loss', 'cancelled'] },
        },
        data: {
          status: 'pending',
          resultAmount: null,
          settledAt: null,
        },
      });

      console.log(`✓ 已撤销期号 ${issue} 的结算记录，请手动重新结算`);
    }

    console.log(`✓ 修改开奖数据: 期号=${issue}, 号码=${number1} ${number2} ${number3}, 总和=${resultSum}`);

    return {
      message: existing.isSettled === 1 
        ? '修改成功，已撤销旧结算记录，请手动重新结算该期号' 
        : '修改成功',
      data: lottery,
      needResettle: existing.isSettled === 1,
    };
  }

  /**
   * 删除开奖数据（仅未结算）
   */
  async deleteLottery(issue: string) {
    // 1. 检查期号是否存在
    const existing = await this.prisma.lotteryResult.findUnique({
      where: { issue },
    });

    if (!existing) {
      throw new BadRequestException(`期号 ${issue} 不存在`);
    }

    // 2. 检查是否已结算（已结算的不能删除，只能修改）
    if (existing.isSettled === 1) {
      throw new BadRequestException(`期号 ${issue} 已结算，无法删除。如需修正数据，请使用编辑功能`);
    }

    // 3. 检查是否有下注记录
    const betCount = await this.prisma.bet.count({
      where: { issue },
    });

    if (betCount > 0) {
      throw new BadRequestException(`期号 ${issue} 存在 ${betCount} 条下注记录，无法删除`);
    }

    // 4. 删除开奖记录
    await this.prisma.lotteryResult.delete({
      where: { issue },
    });

    console.log(`✓ 删除开奖数据: 期号=${issue}`);

    return {
      message: '删除成功',
    };
  }
}

