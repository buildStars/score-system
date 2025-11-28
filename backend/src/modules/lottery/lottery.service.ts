import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryLotteryDto } from './dto/query-lottery.dto';
import {
  isReturn,
  getSizeResult,
  getOddEvenResult,
  getComboResult,
  parseLotteryNumbers,
  calculateMultipleBetResult,
  calculateComboBetResult,
  isComboBetWin,
} from './utils/lottery-rules.util';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class LotteryService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * 从USA28 API同步开奖数据
   */
  async syncLotteryData() {
    try {
      console.log('开始同步USA28开奖数据...');

      // 1. 使用USA28数据源（唯一可用的第三方源）
      const usa28ApiUrl = 'https://api.365kaik.com/api/v1/trend/getHistoryList';
      const params = {
        lotCode: '10029',
        pageSize: '2', // 只获取最新2条，减少延迟
        pageNum: '0',
        t: Date.now().toString(),
      };

      // 2. 从USA28 API获取数据
      console.log('请求USA28 API:', usa28ApiUrl);
      console.log('请求参数:', params);
      
      // 创建 https agent，忽略 SSL 证书验证（仅开发环境）
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // 忽略证书验证
      });
      
      const response = await axios.get(usa28ApiUrl, { 
        params,
        timeout: 10000, // 10秒超时，快速失败
        httpsAgent, // 使用自定义 https agent
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        validateStatus: (status) => status < 500, // 允许4xx状态码
      });

      const apiData = response.data;
      console.log('USA28 API响应状态:', apiData.code);

      // 3. 验证响应格式
      if (!apiData || apiData.code !== 0 || !apiData.data || !apiData.data.list) {
        throw new BadRequestException('USA28 API数据格式错误');
      }

      const list = apiData.data.list;
      console.log(`获取到 ${list.length} 条开奖记录`);

      let syncedCount = 0;
      let latestIssue = '';
      let latestDrawTime: Date | null = null;

      // 4. 处理每条开奖记录
      for (const item of list) {
        try {
          const { drawIssue, drawTime, drawCode } = item;

          // 检查是否已存在
          const existing = await this.prisma.lotteryResult.findUnique({
            where: { issue: drawIssue },
          });

          if (existing) {
            console.log(`期号 ${drawIssue} 已存在，跳过`);
            continue;
          }

          // 5. 解析开奖号码（USA28格式：1,2,1）
          const numbers = drawCode.split(',').map((n: string) => parseInt(n.trim()));
          if (numbers.length !== 3) {
            console.error(`期号 ${drawIssue} 号码格式错误: ${drawCode}`);
            continue;
          }

          const [number1, number2, number3] = numbers;
          const resultSum = number1 + number2 + number3;

          // 6. 判定是否回本
          const returnResult = isReturn(number1, number2, number3, resultSum);

          // 7. 计算大小单双
          const sizeResult = getSizeResult(resultSum);
          const oddEvenResult = getOddEvenResult(resultSum);
          const comboResult = getComboResult(resultSum);

          // 8. 保存开奖结果
          const lotteryResult = await this.prisma.lotteryResult.create({
            data: {
              issue: drawIssue,
              number1,
              number2,
              number3,
              resultSum,
              isReturn: returnResult.isReturn ? 1 : 0,
              returnReason: returnResult.reason,
              sizeResult,
              oddEvenResult,
              comboResult,
              drawTime: new Date(drawTime),
              isSettled: 0,
            },
          });

          console.log(`✓ 成功保存期号 ${drawIssue}: ${number1}+${number2}+${number3}=${resultSum}`);
          
          syncedCount++;
          latestIssue = drawIssue;
          latestDrawTime = lotteryResult.drawTime;

        } catch (itemError) {
          console.error(`处理期号 ${item.drawIssue} 失败:`, itemError.message);
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
        ? `成功同步 ${syncedCount} 条开奖数据`
        : '没有新的开奖数据';

      console.log(message);

      return {
        message,
        syncedCount,
        latestIssue,
        latestDrawTime,
        totalRecords: list.length,
      };

    } catch (error) {
      console.error('同步开奖数据失败：', error);
      
      // 详细错误信息
      let errorMessage = '同步开奖数据失败';
      let errorDetails = '';
      
      if (error.response) {
        // API 返回了错误响应
        errorMessage = `USA28 API错误: ${error.response.status}`;
        errorDetails = JSON.stringify(error.response.data);
        console.error('API响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发送但没有响应
        errorMessage = 'USA28 API无响应，请检查网络连接';
        errorDetails = '可能原因: 1.网络连接问题 2.API服务暂时不可用 3.防火墙阻止 4.DNS解析失败';
        console.error('请求已发送但无响应');
      } else if (error.code === 'ECONNABORTED') {
        // 超时
        errorMessage = 'USA28 API请求超时';
        errorDetails = '请求超过30秒未响应，请稍后重试';
      } else {
        // 其他错误
        errorMessage = error.message || '未知错误';
        errorDetails = error.stack || '';
      }

      console.error('错误详情:', errorDetails);
      
      throw new HttpException(
        `${errorMessage}${errorDetails ? ' - ' + errorDetails : ''}`,
        error.status || 500,
      );
    }
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
        await this.settleSingleBet(bet, lotteryResult, betSettings);
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
  private async settleSingleBet(bet: any, lotteryResult: any, betSettings: any) {
    let resultAmount: number;
    let fee: number;
    let status: string;

    if (bet.betType === 'multiple') {
      // 倍数下注
      const result = calculateMultipleBetResult(
        Number(bet.amount),
        lotteryResult.isReturn === 1,
        betSettings.multipleFeeRate,
        betSettings.multipleFeeBase,
        betSettings.multipleLossRate,
      );
      
      resultAmount = result.resultAmount;
      fee = result.fee;
      status = lotteryResult.isReturn === 1 ? 'win' : 'loss';
    } else {
      // 组合下注（反向逻辑）
      const result = calculateComboBetResult(
        Number(bet.amount),
        bet.betContent,  // 用户下注的组合
        lotteryResult.comboResult,  // 开奖组合结果
        lotteryResult.isReturn === 1,  // 是否回本
        betSettings.comboFeeRate,
        betSettings.comboFeeBase,
      );
      
      resultAmount = result.resultAmount;
      fee = result.fee;
      // 反向逻辑：resultAmount > 0 表示赢钱
      status = resultAmount > 0 ? 'win' : 'loss';
    }

    // 使用事务更新
    await this.prisma.$transaction(async (tx) => {
      const currentPoints = Number(bet.user.points);  // 当前积分（下注时已扣除 amount + fee）
      
      // resultAmount 现在是净盈亏（已扣除本金和手续费）
      // 计算最终积分：当前积分 + 净盈亏
      // 向下取整，用户余额只显示整数
      const finalPointsWithDecimal = currentPoints + resultAmount;
      const finalPoints = Math.floor(finalPointsWithDecimal);

      // 更新用户积分（只保存整数）
      await tx.user.update({
        where: { id: bet.userId },
        data: { 
          points: finalPoints,
        },
      });

      // 更新下注记录
      await tx.bet.update({
        where: { id: bet.id },
        data: {
          status,
          resultAmount,  // 净盈亏
          fee,
          pointsAfter: finalPoints,
          settledAt: new Date(),
        },
      });

      // 记录结算积分变动（净盈亏，已包含手续费）
      await tx.pointRecord.create({
        data: {
          userId: bet.userId,
          type: status === 'win' ? 'win' : 'loss',
          amount: resultAmount,  // 净盈亏（已包含手续费）
          balanceBefore: currentPoints,  // 结算前积分（下注时已扣除）
          balanceAfter: finalPoints,  // 向下取整后的最终积分
          relatedId: bet.id,
          relatedType: 'bet',
          remark: `期号${bet.issue}下注结算-${status === 'win' ? '中奖' : '未中'}（净盈亏含手续费${fee}）`,
          operatorType: 'system',
        },
      });
    });
  }

  /**
   * 获取下注设置
   */
  private async getBetSettings() {
    const settings = await this.prisma.betSetting.findMany();
    const result: any = {};
    
    settings.forEach((setting) => {
      const key = setting.settingKey.replace(/_./g, (m) => m[1].toUpperCase());
      result[key] = setting.valueType === 'number' 
        ? parseFloat(setting.settingValue) 
        : setting.settingValue;
    });

    return {
      multipleFeeRate: result.multipleFeeRate || 3,
      multipleFeeBase: result.multipleFeeBase || 100,
      comboFeeRate: result.comboFeeRate || 5,
      comboFeeBase: result.comboFeeBase || 100,
      multipleLossRate: result.multipleLossRate || 0.8,
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
}

