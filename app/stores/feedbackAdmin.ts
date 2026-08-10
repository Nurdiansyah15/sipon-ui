import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type { MessageResponse } from '#shared/types/Psb'
import type {
  FeedbackItem,
  FeedbackDetail,
  FeedbackComment,
  ListFeedbackQuery,
} from '#shared/types/Feedback'

interface FeedbackAdminState {
  items: FeedbackItem[]
  meta: ApiMeta | null
  selected: FeedbackDetail | null
  comments: FeedbackComment[]
  commentsMeta: ApiMeta | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useFeedbackAdminStore = defineStore('feedbackAdmin', {
  state: (): FeedbackAdminState => ({
    items: [],
    meta: null,
    selected: null,
    comments: [],
    commentsMeta: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchFeedbacks(query: ListFeedbackQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FeedbackItem[]>>('/api/v1/web/feedback/admin/feedbacks', {
          query: {
            category: query.category,
            search: query.search,
            page: query.page,
            limit: query.limit,
          },
        })
        this.items = res.data
        this.meta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar feedback.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchDetail(id: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FeedbackDetail>>(`/api/v1/web/feedback/admin/feedbacks/${id}`)
        this.selected = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail feedback.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchComments(feedbackId: string, page = 1, limit = 50) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FeedbackComment[]>>(`/api/v1/web/feedback/admin/feedbacks/${feedbackId}/comments`, {
          query: { page, limit },
        })
        this.comments = res.data
        this.commentsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat komentar.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async takedownFeedback(feedbackId: string, reason?: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/feedback/admin/feedbacks/${feedbackId}/takedown`, { reason })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menakedown feedback.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async restoreFeedback(feedbackId: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/feedback/admin/feedbacks/${feedbackId}/restore`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal me-restore feedback.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async takedownComment(commentId: string, reason?: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/feedback/admin/comments/${commentId}/takedown`, { reason })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menakedown komentar.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async restoreComment(commentId: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/feedback/admin/comments/${commentId}/restore`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal me-restore komentar.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})
