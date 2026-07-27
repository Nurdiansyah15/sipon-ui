import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  RoleItem,
  UserRoleItem,
  PermissionKeyItem,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolePermissionRequest,
  AssignUserRoleRequest,
  UpdateUserRoleRequest,
  ListRolesQuery,
} from '#shared/types/RolePermission'

interface RolePermissionState {
  roles: RoleItem[]
  rolesMeta: ApiMeta | null
  userRoles: UserRoleItem[]
  userRolesMeta: ApiMeta | null
  permissionKeys: PermissionKeyItem[]
  rolePermissions: string[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useRolePermissionStore = defineStore('rolePermission', {
  state: (): RolePermissionState => ({
    roles: [],
    rolesMeta: null,
    userRoles: [],
    userRolesMeta: null,
    permissionKeys: [],
    rolePermissions: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchRoles(query: ListRolesQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<RoleItem[]>>('/api/v1/web/role-permission/roles', {
          query: {
            page: query.page,
            limit: query.limit,
            sort_by: query.sort_by,
            sort_type: query.sort_type,
            role_type: query.role_type,
            scope_type: query.scope_type,
            assignable: query.assignable,
          },
        })
        this.roles = res.data
        this.rolesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar role.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchRole(id: string): Promise<RoleItem> {
      const api = useApi()
      const res = await api.get<ApiSuccess<RoleItem>>(`/api/v1/web/role-permission/roles/${id}`)
      return res.data
    },

    async createRole(payload: CreateRoleRequest): Promise<RoleItem> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<RoleItem>>('/api/v1/web/role-permission/roles', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat role.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateRole(id: string, payload: UpdateRoleRequest): Promise<RoleItem> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<RoleItem>>(`/api/v1/web/role-permission/roles/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui role.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchPermissionKeys() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<PermissionKeyItem[]>>(
          '/api/v1/web/role-permission/permission-keys',
        )
        this.permissionKeys = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat katalog permission.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async assignRolePermission(roleId: string, payload: AssignRolePermissionRequest): Promise<RoleItem> {
      this.isSubmitting = true
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<RoleItem>>(
          `/api/v1/web/role-permission/roles/${roleId}/permissions`,
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menetapkan permission ke role.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async revokeRolePermission(roleId: string, permissionKey: string): Promise<RoleItem> {
      this.isSubmitting = true
      try {
        const api = useApi()
        const res = await api.delete<ApiSuccess<RoleItem>>(
          `/api/v1/web/role-permission/roles/${roleId}/permissions/${encodeURIComponent(permissionKey)}`,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mencabut permission dari role.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchUserRoles(query: { user_id?: string; role_id?: string; page?: number; limit?: number; is_active?: string } = {}): Promise<UserRoleItem[]> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<UserRoleItem[]>>('/api/v1/web/role-permission/user-roles', {
          query: {
            user_id: query.user_id,
            role_id: query.role_id,
            page: query.page,
            limit: query.limit,
            is_active: query.is_active,
          },
        })
        this.userRoles = res.data
        this.userRolesMeta = res.meta
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat assignment user-role.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async assignUserRole(payload: AssignUserRoleRequest): Promise<UserRoleItem> {
      this.isSubmitting = true
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<UserRoleItem>>('/api/v1/web/role-permission/user-roles', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menetapkan role ke user.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deactivateUserRole(id: string): Promise<UserRoleItem> {
      const api = useApi()
      const res = await api.post<ApiSuccess<UserRoleItem>>(`/api/v1/web/role-permission/user-roles/${id}/deactivate`)
      return res.data
    },

    async reactivateUserRole(id: string): Promise<UserRoleItem> {
      const api = useApi()
      const res = await api.post<ApiSuccess<UserRoleItem>>(`/api/v1/web/role-permission/user-roles/${id}/reactivate`)
      return res.data
    },

    async deleteUserRole(id: string): Promise<void> {
      const api = useApi()
      await api.delete(`/api/v1/web/role-permission/user-roles/${id}`)
    },
  },
})