import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import { ILotteryDataSource, LotteryDataItem } from '../interfaces/lottery-data-source.interface';

/**
 * 加拿大28数据源（备用数据源1）
 * API: https://c2api.canada28.vip/api/lotteryresult/result_jnd28
 */
@Injectable()
export class JND28DataSource implements ILotteryDataSource {
  name = 'JND28';
  priority = 2;
  enabled = true;
  
  private readonly logger = new Logger(JND28DataSource.name);
  private readonly apiUrl = 'https://c2api.canada28.vip/api/lotteryresult/result_jnd28';

  /**
   * 获取最新开奖数据
   */
  async fetchLatestData(): Promise<LotteryDataItem[]> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔄 请求JND28 API: ${this.apiUrl}`);
      
      const params = {
        game_id: '7',
        page: '1',
        pageSize: '2',  // 只获取最新2条
      };

      // 创建 https agent，忽略 SSL 证书验证（仅开发环境）
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });

      const response = await axios.get(this.apiUrl, {
        params,
        timeout: 10000,
        httpsAgent,  // 使用自定义 https agent
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        validateStatus: (status) => status < 500,
      });

      const apiData = response.data;
      
      // 验证响应格式
      if (!apiData || apiData.error !== 0 || !apiData.result_list) {
        throw new Error('JND28 API返回格式错误');
      }

      const result: LotteryDataItem[] = [];

      // 解析result_list中的数据
      for (const item of apiData.result_list) {
        // JND28的期号格式可能不同，需要转换为USA28的格式
        // 确保期号是7位数字
        const issue = String(item.expect);
        
        result.push({
          issue: issue,
          drawTime: new Date(item.datetime),
          number1: Number(item.code1),
          number2: Number(item.code2),
          number3: Number(item.code3),
          sumValue: Number(item.he),
          source: this.name,
        });
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(`✅ JND28获取成功: ${result.length}条数据 (${responseTime}ms)`);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`❌ JND28失败 (${responseTime}ms): ${error.message}`);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchLatestData();
      return true;
    } catch (error) {
      return false;
    }
  }
}

