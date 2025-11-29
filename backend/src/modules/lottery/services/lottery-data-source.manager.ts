import { Injectable, Logger } from '@nestjs/common';
import { ILotteryDataSource, LotteryDataItem, DataSourceResult } from '../interfaces/lottery-data-source.interface';
import { USA28DataSource } from '../data-sources/usa28.data-source';
import { JND28DataSource } from '../data-sources/jnd28.data-source';
import { DatabaseDataSource } from '../data-sources/database.data-source';

/**
 * 彩票数据源管理器
 * 负责协调多个数据源，实现自动故障转移
 */
@Injectable()
export class LotteryDataSourceManager {
  private readonly logger = new Logger(LotteryDataSourceManager.name);
  private dataSources: ILotteryDataSource[] = [];
  
  // 数据新鲜度检测
  private lastFetchedIssue: string | null = null; // 上次获取的最新期号
  private lastFetchTime: number = 0; // 上次获取数据的时间戳
  private staleCountAfterExpected = 0; // 预期开奖后，连续获取到相同期号的次数
  private readonly MAX_STALE_COUNT = 3; // 最多允许连续3次获取到相同期号
  private readonly DRAW_INTERVAL = 210 * 1000; // 开奖间隔（210秒）

  constructor(
    private usa28Source: USA28DataSource,
    private jnd28Source: JND28DataSource,
    private databaseSource: DatabaseDataSource,
  ) {
    // 注册所有数据源，按优先级排序
    this.dataSources = [
      this.usa28Source,
      this.jnd28Source,
      this.databaseSource,
    ].sort((a, b) => a.priority - b.priority);

    this.logger.log(`📚 已注册 ${this.dataSources.length} 个数据源`);
    this.dataSources.forEach(source => {
      this.logger.log(`  - ${source.name} (优先级: ${source.priority}, 状态: ${source.enabled ? '启用' : '禁用'})`);
    });
  }

  /**
   * 获取最新开奖数据（带自动故障转移 + 数据新鲜度检测）
   */
  async fetchLatestData(): Promise<DataSourceResult> {
    this.logger.log('🎯 开始获取开奖数据（多数据源）');

    const enabledSources = this.dataSources.filter(s => s.enabled);
    
    if (enabledSources.length === 0) {
      throw new Error('没有可用的数据源');
    }

    // 按优先级依次尝试每个数据源
    for (const source of enabledSources) {
      const startTime = Date.now();
      
      try {
        this.logger.log(`🔍 尝试数据源: ${source.name} (优先级: ${source.priority})`);
        
        const data = await source.fetchLatestData();
        const responseTime = Date.now() - startTime;

        if (data && data.length > 0) {
          const latestIssue = data[0].issue; // 第一条是最新的
          
          // 🔍 数据新鲜度检测（只在预期开奖后计数）
          const now = Date.now();
          const isAfterExpectedDraw = this.lastFetchTime > 0 && (now - this.lastFetchTime) >= this.DRAW_INTERVAL;
          
          if (this.lastFetchedIssue === latestIssue) {
            // 只有在预期开奖时间后，返回相同期号才算陈旧
            if (isAfterExpectedDraw) {
              this.staleCountAfterExpected++;
              this.logger.warn(
                `⚠️ ${source.name} 开奖后返回旧数据 (期号 ${latestIssue})，已连续 ${this.staleCountAfterExpected}/${this.MAX_STALE_COUNT} 次`
              );
              
              // 如果连续多次返回相同期号，且不是最后一个数据源，尝试下一个
              if (this.staleCountAfterExpected >= this.MAX_STALE_COUNT && source !== enabledSources[enabledSources.length - 1]) {
                this.logger.warn(`🔄 ${source.name} 数据陈旧，切换到下一个数据源...`);
                continue;
              }
            } else {
              // 开奖前返回相同期号是正常的，不计数
              this.logger.debug(`ℹ️ ${source.name} 返回期号 ${latestIssue}（开奖前，正常）`);
            }
          } else {
            // 获取到新数据，重置计数器和时间
            if (this.lastFetchedIssue && latestIssue !== this.lastFetchedIssue) {
              this.logger.log(`🎉 获取到新期号: ${this.lastFetchedIssue} → ${latestIssue}`);
            }
            this.lastFetchedIssue = latestIssue;
            this.lastFetchTime = now; // 记录获取新期号的时间
            this.staleCountAfterExpected = 0; // 重置计数器
          }
          
          this.logger.log(`✅ 成功从 ${source.name} 获取 ${data.length} 条数据 (${responseTime}ms)`);
          
          return {
            success: true,
            data,
            source: source.name,
            responseTime,
          };
        } else {
          this.logger.warn(`⚠️ ${source.name} 返回空数据，尝试下一个数据源`);
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.logger.error(`❌ ${source.name} 失败 (${responseTime}ms): ${error.message}`);
        
        // 记录失败但继续尝试下一个数据源
        await this.logFailure(source.name, error.message);
        
        // 如果不是最后一个数据源，继续尝试
        if (source !== enabledSources[enabledSources.length - 1]) {
          this.logger.log(`➡️ 切换到下一个数据源...`);
          continue;
        }
      }
    }

    // 所有数据源都失败
    const error = '所有数据源均失败';
    this.logger.error(`🚨 ${error}`);
    
    return {
      success: false,
      error,
      source: 'none',
      responseTime: 0,
    };
  }

  /**
   * 健康检查 - 检查所有数据源状态
   */
  async healthCheck(): Promise<{
    timestamp: Date;
    status: 'healthy' | 'degraded' | 'critical';
    dataSources: Array<{
      name: string;
      priority: number;
      enabled: boolean;
      status: 'ok' | 'failed';
      responseTime?: number;
      error?: string;
    }>;
  }> {
    this.logger.log('🏥 开始健康检查...');
    
    const result = {
      timestamp: new Date(),
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      dataSources: [],
    };

    let healthyCount = 0;

    for (const source of this.dataSources) {
      if (!source.enabled) {
        result.dataSources.push({
          name: source.name,
          priority: source.priority,
          enabled: false,
          status: 'ok',
        });
        continue;
      }

      const startTime = Date.now();
      
      try {
        const isHealthy = await source.testConnection();
        const responseTime = Date.now() - startTime;

        if (isHealthy) {
          healthyCount++;
          result.dataSources.push({
            name: source.name,
            priority: source.priority,
            enabled: true,
            status: 'ok',
            responseTime,
          });
        } else {
          result.dataSources.push({
            name: source.name,
            priority: source.priority,
            enabled: true,
            status: 'failed',
            responseTime,
            error: '连接测试失败',
          });
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        result.dataSources.push({
          name: source.name,
          priority: source.priority,
          enabled: true,
          status: 'failed',
          responseTime,
          error: error.message,
        });
      }
    }

    // 判断整体健康状态
    const enabledCount = this.dataSources.filter(s => s.enabled).length;
    
    if (healthyCount === 0) {
      result.status = 'critical';  // 所有数据源都失败
    } else if (healthyCount < enabledCount) {
      result.status = 'degraded';  // 部分数据源失败
    } else {
      result.status = 'healthy';   // 所有数据源正常
    }

    this.logger.log(`🏥 健康检查完成: ${result.status} (${healthyCount}/${enabledCount} 健康)`);
    
    return result;
  }

  /**
   * 启用/禁用数据源
   */
  setDataSourceEnabled(sourceName: string, enabled: boolean) {
    const source = this.dataSources.find(s => s.name === sourceName);
    if (source) {
      source.enabled = enabled;
      this.logger.log(`${enabled ? '✅ 启用' : '⛔ 禁用'} 数据源: ${sourceName}`);
    }
  }

  /**
   * 获取所有数据源列表
   */
  getDataSources() {
    return this.dataSources.map(s => ({
      name: s.name,
      priority: s.priority,
      enabled: s.enabled,
    }));
  }

  /**
   * 记录数据源失败（可扩展为写入数据库）
   */
  private async logFailure(sourceName: string, error: string) {
    // TODO: 可以将失败记录写入数据库，用于统计和告警
    this.logger.debug(`记录失败: ${sourceName} - ${error}`);
  }
}

