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

export interface UpdateProfileRequest {
  fullname?: string
  email?: string
  phone?: string
}

export interface UpdateProfileResponse {
  message: string
}

export interface CheckUsernameResponse {
  available: boolean
}

export interface ChangeUsernameRequest {
  username: string
}

export interface ChangeUsernameResponse {
  message: string
  username: string
}

export interface ChangeIdentityResponse {
  message: string
}

export interface RequestIdentityOTPRequest {
  identifier: string
}

export interface VerifyIdentityOTPRequest {
  identifier: string
  otp: string
}

export interface IdentityOTPResponse {
  message: string
}

export interface AvatarPresignRequest {
  content_type: string
}

export interface AvatarPresignResponse {
  presign_url: string
  key: string
  expires_in: number
}

export interface AvatarConfirmResponse {
  avatar_url: string
}
