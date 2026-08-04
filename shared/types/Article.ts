export interface ArticleListItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  category_id: string | null
  category_name: string | null
  author: string
  thumbnail_url: string | null
  is_featured: boolean
  view_count: number
  published_at: string | null
  created_at: string
}

export interface ArticleDetail {
  id: string
  title: string
  content: string
  summary: string | null
  category_id: string | null
  category_name: string | null
  status: string
  author: string
  thumbnail_url: string | null
  view_count: number
  is_featured: boolean
  created_by: string | null
  updated_by: string | null
  published_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CategoryItem {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
}

export interface CreateArticleRequest {
  title: string
  content: string
  summary?: string | null
  category_id?: string | null
  author: string
  thumbnail_url?: string | null
  is_featured?: boolean
  status?: 'draft' | 'published'
}

export interface UpdateArticleRequest {
  title?: string
  content?: string
  summary?: string | null
  category_id?: string | null
  author?: string
  thumbnail_url?: string | null
  is_featured?: boolean
}

export interface ListArticlesQuery {
  page?: number
  limit?: number
  status?: string
  category_id?: string
  q?: string
  sort_by?: string
  sort_type?: 'ASC' | 'DESC'
}

export interface CreateCategoryRequest {
  name: string
  slug: string
  sort_order?: number
}

export interface UpdateCategoryRequest {
  name?: string
  slug?: string
  is_active?: boolean
  sort_order?: number
}

export interface PresignRequest {
  content_type: string
}

export interface PresignResponse {
  presign_url: string
  key: string
  public_url: string
  expires_in: number
}

export interface ConfirmUploadRequest {
  key: string
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Dipublikasi',
  archived: 'Diarsipkan',
}
