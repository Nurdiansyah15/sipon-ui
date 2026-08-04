import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  ArticleListItem,
  ArticleDetail,
  CategoryItem,
  CreateArticleRequest,
  UpdateArticleRequest,
  ListArticlesQuery,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PresignResponse,
  SourceListItem,
  CreateSourceRequest,
  UpdateSourceRequest,
  CreateSourceCategoryRequest,
  UpdateSourceCategoryRequest,
  ScrapeResult,
} from '#shared/types/Article'

interface ArticleState {
  items: ArticleListItem[]
  meta: ApiMeta | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useArticleStore = defineStore('article', {
  state: (): ArticleState => ({
    items: [],
    meta: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchList(query: ListArticlesQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ArticleListItem[]>>('/api/v1/web/articles', {
          query: {
            page: query.page,
            limit: query.limit,
            status: query.status,
            category_id: query.category_id,
            q: query.q,
            sort_by: query.sort_by,
            sort_type: query.sort_type,
          },
        })
        this.items = res.data
        this.meta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar artikel.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchDetail(id: string): Promise<ArticleDetail> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ArticleDetail>>(`/api/v1/web/articles/${id}`)
        return res.data
      } catch (err) {
        throw err
      }
    },

    async create(payload: CreateArticleRequest): Promise<{ id: string }> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<{ id: string }>>('/api/v1/web/articles', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat artikel.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async update(id: string, payload: UpdateArticleRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`/api/v1/web/articles/${id}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui artikel.')
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
        await api.delete(`/api/v1/web/articles/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus artikel.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async publish(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`/api/v1/web/articles/${id}/publish`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mempublikasikan artikel.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async archive(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`/api/v1/web/articles/${id}/archive`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengarsipkan artikel.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchCategories(activeOnly = false): Promise<CategoryItem[]> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<CategoryItem[]>>('/api/v1/web/article-categories', {
          query: { active_only: activeOnly },
        })
        return res.data
      } catch (err) {
        throw err
      }
    },

    async createCategory(payload: CreateCategoryRequest): Promise<{ id: string }> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<{ id: string }>>('/api/v1/web/article-categories', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat kategori.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateCategory(id: string, payload: UpdateCategoryRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`/api/v1/web/article-categories/${id}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui kategori.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteCategory(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/article-categories/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus kategori.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async presignThumbnail(contentType: string): Promise<PresignResponse> {
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<PresignResponse>>('/api/v1/web/articles/media/presign', {
          content_type: contentType,
        })
        return res.data
      } catch (err) {
        throw err
      }
    },

    async confirmUpload(key: string) {
      try {
        const api = useApi()
        await api.post('/api/v1/web/articles/media/confirm', { key })
      } catch (err) {
        throw err
      }
    },

    async fetchSources(): Promise<SourceListItem[]> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SourceListItem[]>>('/api/v1/web/article-sources')
        return res?.data || []
      } catch (err) {
        throw err
      }
    },

    async createSource(payload: CreateSourceRequest): Promise<{ id: string; key: string }> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<{ id: string; key: string }>>('/api/v1/web/article-sources', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat sumber.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateSource(id: string, payload: UpdateSourceRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`/api/v1/web/article-sources/${id}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui sumber.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteSource(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/article-sources/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus sumber.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async createSourceCategory(sourceId: string, payload: CreateSourceCategoryRequest): Promise<{ id: string }> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<{ id: string }>>(`/api/v1/web/article-sources/${sourceId}/categories`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat kategori sumber.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateSourceCategory(categoryId: string, payload: UpdateSourceCategoryRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`/api/v1/web/article-sources/categories/${categoryId}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui kategori sumber.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteSourceCategory(categoryId: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/article-sources/categories/${categoryId}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus kategori sumber.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async triggerScrape(sourceId: string): Promise<ScrapeResult> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ScrapeResult>>(`/api/v1/web/article-sources/${sourceId}/scrape`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menjalankan scrape.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})
