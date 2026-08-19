import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  NotificationItem,
  UnreadCountResponse,
  NotificationPreference,
  UpdateNotificationPreferenceRequest,
  ListNotificationsQuery,
} from '#shared/types/Notification'

interface NotificationState {
  items: NotificationItem[]
  meta: ApiMeta | null
  unreadCount: number
  preference: NotificationPreference | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    items: [],
    meta: null,
    unreadCount: 0,
    preference: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchInbox(query: ListNotificationsQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<NotificationItem[]>>('/api/v1/web/notifications/inbox', {
          query: {
            unread_only: query.unread_only,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
          },
        })
        if (query.page && query.page > 1) {
          this.items.push(...res.data)
        } else {
          this.items = res.data
        }
        this.meta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat inbox notifikasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchUnreadCount() {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<UnreadCountResponse>>('/api/v1/web/notifications/unread-count')
        this.unreadCount = res.data.count
      } catch {
        // best-effort — badge tetap tampil 0 bila gagal
      }
    },

    async markRead(id: string) {
      try {
        const api = useApi()
        await api.post(`/api/v1/web/notifications/${id}/read`)
        const item = this.items.find(i => i.id === id)
        if (item && !item.is_read) {
          item.is_read = true
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menandai notifikasi dibaca.')
        throw err
      }
    },

    async markAllRead() {
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<{ marked: number }>>('/api/v1/web/notifications/read-all')
        this.items.forEach(i => { i.is_read = true })
        this.unreadCount = 0
        return res.data.marked
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menandai semua notifikasi dibaca.')
        throw err
      }
    },

    async fetchPreference() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<NotificationPreference>>('/api/v1/web/notifications/preferences')
        this.preference = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat preferensi notifikasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updatePreference(payload: UpdateNotificationPreferenceRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<NotificationPreference>>('/api/v1/web/notifications/preferences', payload)
        this.preference = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui preferensi notifikasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    reset() {
      this.items = []
      this.meta = null
      this.unreadCount = 0
      this.preference = null
      this.error = null
    },
  },
})
