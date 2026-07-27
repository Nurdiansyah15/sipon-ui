export interface RoleItem {
  id: string
  name: string
  display_name: string
  description?: string | null
  role_type: 'system' | 'custom'
  scope_type: 'global' | 'region' | 'community'
  assignable: boolean
  created_at: string
  updated_at: string
  permissions?: string[]
}

export interface RoleSummary {
  id: string
  name: string
  display_name: string
  role_type?: 'system' | 'custom'
  assignable?: boolean
}

export interface UserRoleItem {
  id: string
  user_id: string
  user: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
  }
  role_id: string
  role: RoleSummary
  scope_type: string
  scope_id?: string | null
  assigned_at: string
  assigned_by?: string | null
  expired_at?: string | null
  is_active: boolean
  deactivated_at?: string | null
  permissions?: string[]
}

export interface PermissionKeyItem {
  key: string
  display_name: string
  description?: string
}

export interface ListRolesQuery {
  page?: number
  limit?: number
  sort_by?: string
  sort_type?: string
  role_type?: string
  scope_type?: string
  assignable?: string
}

export interface CreateRoleRequest {
  name: string
  display_name: string
  description?: string
  role_type: 'system' | 'custom'
  scope_type: 'global' | 'region' | 'community'
  assignable: boolean
}

export interface UpdateRoleRequest {
  display_name?: string
  description?: string
  assignable?: boolean
}

export interface AssignRolePermissionRequest {
  permission_key: string
  notes?: string
}

export interface AssignUserRoleRequest {
  user_id: string
  role_id: string
  scope_type: 'global' | 'region' | 'community'
  scope_id?: string | null
  expired_at?: string | null
  notes?: string
}

export interface UpdateUserRoleRequest {
  expired_at?: string | null
}