import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type { MessageResponse } from '#shared/types/Psb'
import type {
  FeedbackItem,
  FeedbackDetail,
  FeedbackComment,
  FeedbackAttachment,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  CreateCommentRequest,
  ListFeedbackQuery,
  AttachmentPresignResponse,
  AttachmentConfirmRequest,
  ToggleLikeResponse,
} from '#shared/types/Feedback'

interface FeedbackState {
  items: FeedbackItem[]
  meta: ApiMeta | null
  selected: FeedbackDetail | null
  comments: FeedbackComment[]
  commentsMeta: ApiMeta | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useFeedbackStore = defineStore('feedback', {
  state: (): FeedbackState => ({
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
        const res = await api.get<ApiSuccess<FeedbackItem[]>>('/api/v1/web/feedbacks', {
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

    async fetchMyFeedbacks(query: ListFeedbackQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FeedbackItem[]>>('/api/v1/web/feedbacks/my', {
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
        this.error = parseApiError(err, 'Gagal memuat feedback milik saya.')
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
        const res = await api.get<ApiSuccess<FeedbackDetail>>(`/api/v1/web/feedbacks/${id}`)
        this.selected = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail feedback.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createFeedback(payload: CreateFeedbackRequest): Promise<FeedbackDetail> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<FeedbackDetail>>('/api/v1/web/feedbacks', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat feedback.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateFeedback(id: string, payload: UpdateFeedbackRequest): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<MessageResponse>>(`/api/v1/web/feedbacks/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui feedback.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteFeedback(id: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.delete<ApiSuccess<MessageResponse>>(`/api/v1/web/feedbacks/${id}`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus feedback.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchComments(feedbackId: string, page = 1, limit = 50) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FeedbackComment[]>>(`/api/v1/web/feedbacks/${feedbackId}/comments`, {
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

    async createComment(feedbackId: string, payload: CreateCommentRequest): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/feedbacks/${feedbackId}/comments`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menambahkan komentar.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateComment(commentId: string, body: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<MessageResponse>>(`/api/v1/web/comments/${commentId}`, { body })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui komentar.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteComment(commentId: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.delete<ApiSuccess<MessageResponse>>(`/api/v1/web/comments/${commentId}`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus komentar.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async toggleLikeFeedback(feedbackId: string): Promise<ToggleLikeResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ToggleLikeResponse>>(`/api/v1/web/feedbacks/${feedbackId}/like`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengubah like.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async toggleLikeComment(commentId: string): Promise<ToggleLikeResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ToggleLikeResponse>>(`/api/v1/web/comments/${commentId}/like`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengubah like komentar.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async requestAttachmentPresign(feedbackId: string, filename: string, contentType: string): Promise<AttachmentPresignResponse> {
      const api = useApi()
      const res = await api.post<ApiSuccess<AttachmentPresignResponse>>(`/api/v1/web/feedbacks/${feedbackId}/attachments/presign`, { filename, content_type: contentType })
      return res.data
    },

    async confirmAttachment(feedbackId: string, payload: AttachmentConfirmRequest): Promise<FeedbackAttachment> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<FeedbackAttachment>>(`/api/v1/web/feedbacks/${feedbackId}/attachments/confirm`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengunggah attachment.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteAttachment(feedbackId: string, attachmentId: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.delete<ApiSuccess<MessageResponse>>(`/api/v1/web/feedbacks/${feedbackId}/attachments/${attachmentId}`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus attachment.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    /**
     * Upload a single file to a feedback: presign -> PUT to storage -> confirm.
     * Returns the stored attachment.
     */
    async uploadAttachment(feedbackId: string, file: File): Promise<FeedbackAttachment> {
      const { presign_url, key } = await this.requestAttachmentPresign(feedbackId, file.name, file.type)

      const uploadRes = await fetch(presign_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) {
        throw new Error(`Upload gagal: ${uploadRes.status}`)
      }

      return this.confirmAttachment(feedbackId, {
        key,
        original_filename: file.name,
        mime_type: file.type,
        size: file.size,
      })
    },
  },
})
