export type DokumenAsetKategori = 'formulir' | 'surat' | 'panduan' | 'brosur' | 'lainnya'

export interface DokumenAsetItem {
  id: string
  judul: string
  deskripsi?: string | null
  kategori: DokumenAsetKategori
  filename: string
  mime_type: string
  size: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface DokumenAsetDetail {
  id: string
  judul: string
  deskripsi?: string | null
  kategori: DokumenAsetKategori
  filename: string
  mime_type: string
  size: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  download_url?: string | null
}

export interface DokumenAsetPresignRequest {
  content_type: string
  filename: string
  kategori: string
  deskripsi?: string
  is_public: boolean
}

export interface DokumenAsetPresignResponse {
  presign_url: string
  key: string
  expires_in: number
}

export interface DokumenAsetConfirmRequest {
  key: string
  judul: string
  kategori: string
  deskripsi?: string
  original_filename: string
  mime_type: string
  size: number
  is_public: boolean
}

export interface DokumenAsetConfirmResponse {
  id: string
  judul: string
  kategori: string
  key: string
  created_at: string
}

export interface DokumenAsetUpdateRequest {
  judul?: string
  deskripsi?: string
  kategori?: string
  is_public?: boolean
}

export interface DokumenAsetDownloadResponse {
  access_url: string
  expires_in: number
}

export interface DokumenAsetListQuery {
  kategori?: string
  search?: string
  page?: number
  limit?: number
}

export const KATEGORI_LABELS: Record<DokumenAsetKategori, string> = {
  formulir: 'Formulir',
  surat: 'Surat',
  panduan: 'Panduan',
  brosur: 'Brosur',
  lainnya: 'Lainnya',
}

export const KATEGORI_ICONS: Record<DokumenAsetKategori, string> = {
  formulir: 'i-lucide-clipboard-list',
  surat: 'i-lucide-mail',
  panduan: 'i-lucide-book-open',
  brosur: 'i-lucide-bookmark',
  lainnya: 'i-lucide-file-text',
}

export const KATEGORI_COLORS: Record<DokumenAsetKategori, string> = {
  formulir: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  surat: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  panduan: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  brosur: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}
