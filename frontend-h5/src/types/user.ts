// 用户信息
export interface UserInfo {
  id: number
  username: string
  nickname: string
  points: number
  status: number
  createdAt?: string
  lastLoginAt?: string
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  user: UserInfo
  token: string
  expiresIn: number
}

// 修改密码请求
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

