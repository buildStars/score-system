import request from './request'

export interface CreateMessageDto {
  name: string
  contact: string
  message: string
}

/**
 * 提交留言
 */
export function submitMessage(data: CreateMessageDto) {
  return request.post('/message/submit', data)
}

