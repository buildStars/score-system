/**
 * 彩票数据源接口
 * 用于统一不同数据源的访问方式
 */
export interface ILotteryDataSource {
  name: string;
  priority: number;
  enabled: boolean;
  fetchLatestData(): Promise<LotteryDataItem[]>;
  testConnection(): Promise<boolean>;
}

/**
 * 统一的彩票数据格式
 */
export interface LotteryDataItem {
  issue: string;          // 期号
  drawTime: Date;         // 开奖时间
  number1: number;        // 第一个号码
  number2: number;        // 第二个号码
  number3: number;        // 第三个号码
  sumValue: number;       // 和值
  source: string;         // 数据来源
}

/**
 * 数据源响应结果
 */
export interface DataSourceResult {
  success: boolean;
  data?: LotteryDataItem[];
  error?: string;
  source: string;
  responseTime: number;
}

