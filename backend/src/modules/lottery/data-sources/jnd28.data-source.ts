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
  priority = 1;  // 主数据源
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
        pageSize: '2',
      };

      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: false,
        maxSockets: 1,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
      });

      const response = await axios.get(this.apiUrl, {
        params,
        timeout: 15000,
        httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'close',
          'Cache-Control': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
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
        const issue = String(item.expect);
        
        // 🔧 修复：使用 opentime 作为开奖时间（格式: "21:39:30"）
        // datetime 是数据入库时间，opentime 才是真正的开奖时间
        const drawTimeStr = item.datetime.split(' ')[0] + ' ' + item.opentime; // "2025-11-29 21:39:30"
        
        result.push({
          issue: issue,
          drawTime: new Date(drawTimeStr),
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
      
      // 打印详细错误信息
      if (error.code) {
        this.logger.error(`   错误代码: ${error.code}`);
      }
      if (error.errno) {
        this.logger.error(`   错误编号: ${error.errno}`);
      }
      if (error.syscall) {
        this.logger.error(`   系统调用: ${error.syscall}`);
      }
      if (error.response) {
        this.logger.error(`   响应状态: ${error.response.status}`);
        this.logger.error(`   响应数据: ${JSON.stringify(error.response.data)}`);
      }
      
      // 打印完整堆栈（开发环境）
      this.logger.debug(`   完整错误: ${JSON.stringify(error, null, 2)}`);
      
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

