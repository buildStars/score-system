import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import { ILotteryDataSource, LotteryDataItem } from '../interfaces/lottery-data-source.interface';

/**
 * USA28数据源（主数据源）
 * API: https://api.365kaik.com/api/v1/trend/getHistoryList
 */
@Injectable()
export class USA28DataSource implements ILotteryDataSource {
  name = 'USA28';
  priority = 1;
  enabled = true;
  
  private readonly logger = new Logger(USA28DataSource.name);
  private readonly apiUrl = 'https://api.365kaik.com/api/v1/trend/getHistoryList';

  /**
   * 获取最新开奖数据
   */
  async fetchLatestData(): Promise<LotteryDataItem[]> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔄 请求USA28 API: ${this.apiUrl}`);
      
      const params = {
        lotCode: '10029',
        pageSize: '2',
        pageNum: '0',
        t: Date.now().toString(),
      };

      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });

      const response = await axios.get(this.apiUrl, {
        params,
        timeout: 10000,
        httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        validateStatus: (status) => status < 500,
      });

      const apiData = response.data;
      
      if (!apiData || apiData.code !== 0 || !apiData.data || !apiData.data.list) {
        throw new Error('USA28 API返回格式错误');
      }

      const list = apiData.data.list;
      const result: LotteryDataItem[] = [];

      for (const item of list) {
        const numbers = item.drawCode.split(',').map((n: string) => parseInt(n.trim()));
        
        if (numbers.length !== 3) {
          this.logger.warn(`期号 ${item.drawIssue} 号码格式错误: ${item.drawCode}`);
          continue;
        }

        result.push({
          issue: item.drawIssue,
          drawTime: new Date(item.drawTime),
          number1: numbers[0],
          number2: numbers[1],
          number3: numbers[2],
          sumValue: numbers[0] + numbers[1] + numbers[2],
          source: this.name,
        });
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(`✅ USA28获取成功: ${result.length}条数据 (${responseTime}ms)`);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`❌ USA28失败 (${responseTime}ms): ${error.message}`);
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

