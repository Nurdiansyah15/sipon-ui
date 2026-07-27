import type { SessionPermission, SessionRole } from './Session'

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
  roles: SessionRole[]
  permissions: SessionPermission[]
}
