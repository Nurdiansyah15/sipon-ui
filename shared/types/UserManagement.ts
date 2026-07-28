export interface UserRoleSummary {
  id: string
  role_id: string
  role_name: string
  scope_type: string
  scope_id?: string | null
  is_active: boolean
}

export interface UserManagementItem {
  id: string
  username: string
  fullname?: string | null
  email: string
  phone?: string | null
  status: string
  created_at: string
  updated_at: string
  last_login_at?: string | null
  roles?: UserRoleSummary[]
}

export interface CreateUserRequest {
  username: string
  email: string
  fullname?: string
  phone?: string
}

export interface CreateUserResponse extends UserManagementItem {
  generated_password: string
}

export interface ResetUserPasswordResponse {
  generated_password: string
}

export interface ListUsersQuery {
  page?: number
  limit?: number
  sort_by?: string
  sort_type?: string
  status?: string
  role_id?: string
  search?: string
}

export interface UserScope {
  id: string
  scope_type: string
  scope_value: string
}

export interface AssignUserScopeRequest {
  scope_type: string
  scope_value: string
}