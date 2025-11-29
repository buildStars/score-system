import request from '@/utils/request'
import type { ApiResponse, PaginationResponse, PointRecord } from '@/types'

/**
 * 获取积分记录
 */
export const getPointRecordList = (params: {
  page?: number
  limit?: number
  userId?: number
  type?: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, ApiResponse<PaginationResponse<PointRecord>>>('/admin/point-records', {
    params,
  })
}





