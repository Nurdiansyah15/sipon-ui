import type { SessionPermission, SessionRole, SessionUserScope } from './Session'

export interface ProfileData {
  id: string
  username: string
  fullname: string | null
  email: string
  is_email_verified: boolean
  phone?: string | null
  is_phone_verified: boolean
  status: string
  has_password: boolean
  created_at: string
  avatar_url?: string | null
  roles: SessionRole[]
  permissions: SessionPermission[]
  scopes: SessionUserScope[]
}
