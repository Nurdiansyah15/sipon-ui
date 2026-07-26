import type { UserMe } from './User'

export interface LoginRequest {
  identifier: string
  password: string
  device_id?: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  phone?: string
  fullname?: string
  device_id?: string
}

export interface LoginResponse {
  token: string
  refresh_token: string
  user: UserMe
}

export interface RegisterResponse extends LoginResponse {
  user_id: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}
