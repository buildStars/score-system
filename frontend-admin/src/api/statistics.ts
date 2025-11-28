import request from '@/utils/request'
import type { ApiResponse, StatisticsData } from '@/types'

/**
 * 获取统计数据
 */
export const getStatistics = (params: { startDate: string; endDate: string }) => {
  return request.get<any, ApiResponse<StatisticsData>>('/admin/statistics', { params })
}



