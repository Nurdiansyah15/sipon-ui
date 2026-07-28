export interface SessionUser {
  id: string
  name: string
  email: string
  username: string
}

export interface SessionRole {
  name: string
  role_type: 'system' | 'custom'
  scope_type: 'global' | 'region' | 'community'
  scope_id: string | null
}

export interface SessionPermission {
  key: string
  scope: 'global' | 'region' | 'community'
}

export interface SessionUserScope {
  scope_type: string
  scope_value: string
}

export interface SessionData {
  user: SessionUser
  roles: SessionRole[]
  permissions: SessionPermission[]
  scopes: SessionUserScope[]
}
