export interface ApiSuccess<T> {
  status: 'success'
  status_code: number
  message: string
  data: T
  meta: ApiMeta | null
}

export interface ApiMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ApiError {
  status: 'error'
  status_code: number
  error_code: string
  errors: string | Record<string, string>
}
