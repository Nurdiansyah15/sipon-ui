export interface TipeSuratItem {
  id: string
  nama: string
  kode: string
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface TipeSuratFormPayload {
  nama: string
  kode: string
}

export interface SuratItem {
  id: string
  nomor: string
  tipe_surat_id: string
  keterangan?: string | null
  tanggal: string
  created_by: string
  scope_id?: string | null
  created_at: string
}

export interface SuratDetail {
  id: string
  nomor: string
  tipe_surat_id: string
  tipe_surat_nama: string
  tipe_surat_kode: string
  keterangan?: string | null
  tanggal: string
  created_by: string
  scope_id?: string | null
  created_at: string
  dokumen_aset_ids: string[]
}

export interface SuratCreatePayload {
  tipe_surat_id: string
  keterangan?: string
  tanggal: string
  dokumen_aset_ids?: string[]
}

export interface AddSuratDokumenPayload {
  dokumen_aset_id: string
}

export interface TautDokumenResponse {
  surat_id: string
  dokumen_aset_id: string
}

export interface SuratDownloadResponse {
  access_url: string
  expires_in: number
}

export interface ListSuratQuery {
  page?: number
  limit?: number
  tipe_surat_id?: string
  bulan?: number
  tahun?: number
  search?: string
  sort_by?: string
  sort_type?: string
}

export const BULAN_OPTIONS: { label: string; value: number }[] = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]
