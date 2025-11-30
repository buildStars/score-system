import request from '@/utils/request'

export interface Message {
  id: number
  name: string
  contact: string
  message: string
  status: 'unread' | 'read' | 'replied'
  adminReply?: string
  repliedAt?: string
  repliedBy?: number
  createdAt: string
  updatedAt: string
}

export interface QueryMessageDto {
  status?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface ReplyMessageDto {
  adminReply: string
}

/**
 * 获取留言列表
 */
export function getMessageList(params: QueryMessageDto) {
  return request.get<{
    list: Message[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>('/message/list', { params })
}

/**
 * 获取留言详情
 */
export function getMessageDetail(id: number) {
  return request.get<Message>(`/message/${id}`)
}

/**
 * 回复留言
 */
export function replyMessage(id: number, data: ReplyMessageDto) {
  return request.post(`/message/${id}/reply`, data)
}

/**
 * 删除留言
 */
export function deleteMessage(id: number) {
  return request.delete(`/message/${id}`)
}

/**
 * 批量删除留言
 */
export function batchDeleteMessages(ids: number[]) {
  return request.post('/message/batch-delete', { ids })
}

/**
 * 获取未读留言数量
 */
export function getUnreadCount() {
  return request.get<{ count: number }>('/message/unread-count')
}

