// API通用响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页请求参数
export interface PageParams {
  page?: number
  limit?: number
}

// 分页响应数据
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}





