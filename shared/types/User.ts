export interface UserMe {
  id: string
  username: string
  email: string
  is_email_verified: boolean
  fullname: string | null
  phone?: string | null
  is_phone_verified: boolean
  avatar_url?: string | null
  status: string
  created_at: string
  has_password: boolean
}
