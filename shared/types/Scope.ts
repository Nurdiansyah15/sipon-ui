export interface ScopeItem {
  id: string
  scope_type: string
  code: string
  name: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateScopeRequest {
  scope_type: string
  code: string
  name: string
  description?: string | null
}

export interface UpdateScopeRequest {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface ListScopesQuery {
  scope_type?: string
  include_inactive?: boolean
}

// Label untuk tipe scope yang sudah dikenal. Tipe baru cukup ditambahkan di
// sini (atau dirender apa adanya) — master scope bersifat extensible.
export const SCOPE_TYPE_LABELS: Record<string, string> = {
  gender: 'Gender',
}

export const SCOPE_TYPE_COLORS: Record<string, string> = {
  gender: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}
