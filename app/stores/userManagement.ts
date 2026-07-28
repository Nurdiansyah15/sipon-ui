import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  UserManagementItem,
  CreateUserRequest,
  CreateUserResponse,
  ResetUserPasswordResponse,
  ListUsersQuery,
  UserScope,
} from '#shared/types/UserManagement'

interface UserManagementState {
  items: UserManagementItem[]
  meta: ApiMeta | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  // Penampung password satu-kali dari create/reset — TIDAK boleh persist ke
  // localStorage lewat auth store. Komponen modal bertanggung jawab menampilkannya
  // sekali lalu membuangnya (lihat system-management plan §Frontend password-reveal).
  oneTimePassword: string | null
}

export const useUserManagementStore = defineStore('userManagement', {
  state: (): UserManagementState => ({
    items: [],
    meta: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    oneTimePassword: null,
  }),

  actions: {
    async fetchUsers(query: ListUsersQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<UserManagementItem[]>>('/api/v1/web/users', {
          query: {
            page: query.page,
            limit: query.limit,
            sort_by: query.sort_by,
            sort_type: query.sort_type,
            status: query.status,
            role_id: query.role_id,
            search: query.search,
          },
        })
        this.items = res.data
        this.meta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar user.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchUser(id: string): Promise<UserManagementItem> {
      const api = useApi()
      const res = await api.get<ApiSuccess<UserManagementItem>>(`/api/v1/web/users/${id}`)
      return res.data
    },

    async createUser(payload: CreateUserRequest): Promise<CreateUserResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<CreateUserResponse>>('/api/v1/web/users', payload)
        // generated_password hanya ditampilkan sekali di sini — diserahkan ke
        // komponen modal yang langsung menampilkannya, lalu dibuang.
        this.oneTimePassword = res.data.generated_password
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat user.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async resetUserPassword(id: string): Promise<ResetUserPasswordResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ResetUserPasswordResponse>>(
          `/api/v1/web/users/${id}/reset-password`,
        )
        this.oneTimePassword = res.data.generated_password
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyetel ulang kata sandi user.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deactivateUser(id: string): Promise<UserManagementItem> {
      const api = useApi()
      const res = await api.post<ApiSuccess<UserManagementItem>>(`/api/v1/web/users/${id}/deactivate`)
      return res.data
    },

    async reactivateUser(id: string): Promise<UserManagementItem> {
      const api = useApi()
      const res = await api.post<ApiSuccess<UserManagementItem>>(`/api/v1/web/users/${id}/reactivate`)
      return res.data
    },

    async fetchUserScopes(userId: string): Promise<UserScope[]> {
      const api = useApi()
      const res = await api.get<ApiSuccess<UserScope[]>>(`/api/v1/web/users/${userId}/scopes`)
      return res.data
    },

    async assignUserScope(userId: string, scopeType: string, scopeValue: string): Promise<UserScope> {
      const api = useApi()
      const res = await api.post<ApiSuccess<UserScope>>(`/api/v1/web/users/${userId}/scopes`, {
        scope_type: scopeType,
        scope_value: scopeValue,
      })
      return res.data
    },

    async removeUserScope(userId: string, scopeId: string): Promise<void> {
      const api = useApi()
      await api.delete(`/api/v1/web/users/${userId}/scopes/${scopeId}`)
    },

    clearOneTimePassword() {
      this.oneTimePassword = null
    },
  },
})