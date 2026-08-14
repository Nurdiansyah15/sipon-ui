import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type {
  ScopeItem,
  CreateScopeRequest,
  UpdateScopeRequest,
  ListScopesQuery,
} from '#shared/types/Scope'

interface ScopeState {
  items: ScopeItem[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useScopeStore = defineStore('scope', {
  state: (): ScopeState => ({
    items: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchList(query: ListScopesQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ScopeItem[]>>('/api/v1/web/system/scopes', {
          query: {
            scope_type: query.scope_type,
            include_inactive: query.include_inactive,
          },
        })
        this.items = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar scope.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async create(payload: CreateScopeRequest): Promise<ScopeItem> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ScopeItem>>('/api/v1/web/system/scopes', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat scope.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async update(id: string, payload: UpdateScopeRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`/api/v1/web/system/scopes/${id}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui scope.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async remove(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/system/scopes/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus scope.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})
