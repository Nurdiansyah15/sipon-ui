// ===== Enums / status literals =====

export type PendaftarStatus =
  | 'draft'
  | 'diajukan'
  | 'perlu_revisi'
  | 'ditolak'
  | 'diterima'
  | 'mengundurkan_diri'
  | 'daftar_ulang'
  | 'perlu_revisi_daftar_ulang'
  | 'selesai'

export type DokumenStage = 'pendaftaran' | 'daftar_ulang'

export type DokumenKind = 'surat_pernyataan' | 'ktp' | 'kk' | 'mutasi' | 'pembayaran'

export type DokumenStatus = 'pending' | 'verified' | 'rejected'

export type ReviewStage = 'pendaftaran' | 'daftar_ulang'

export type ReviewAction = 'perlu_revisi' | 'ditolak' | 'diterima'

export type PsbSettingStatus = 'active' | 'closed'

// ===== Profile fields (mirror Santri entity) =====

export interface PendaftarProfileFields {
  nickname: string | null
  program: string | null
  hobby: string | null
  purpose: string | null
  motivation_entry: string | null
  pob: string | null
  dob: string | null
  blood: string | null

  address: string | null
  sub_district: string | null
  district: string | null
  province: string | null
  postal_code: string | null

  previous_pondok_name: string | null
  previous_pondok_address: string | null
  previous_pondok_div: string | null
  previous_pondok_time: string | null

  nik: string | null
  no_kk: string | null
  nisn: string | null
  no_kip: string | null
  no_kks: string | null
  no_pkh: string | null

  workplace: string | null
  department: string | null

  home_status: string | null

  father: string | null
  father_pn: string | null
  father_nik: string | null
  father_job: string | null
  father_graduate: string | null
  father_income: string | null

  mother: string | null
  mother_pn: string | null
  mother_nik: string | null
  mother_job: string | null
  mother_graduate: string | null
  mother_income: string | null

  guardian_relationship: string | null
  guardian: string | null
  guardian_pn: string | null
  guardian_nik: string | null
  guardian_job: string | null
  guardian_graduate: string | null
  guardian_income: string | null
}

export interface FormulirDokumenItem {
  stage: DokumenStage
  kind: DokumenKind
  key: string
}

// ===== Pendaftaran =====

export type UpsertFormulirRequest = PendaftarProfileFields & {
  dokumen?: FormulirDokumenItem[]
}

export interface PendaftarResponse extends PendaftarProfileFields {
  id: string
  user_id: string
  psb_setting_id: string
  gender: string
  status: PendaftarStatus
  accepted_by: string | null
  accepted_at: string | null
  santri_id: string | null
  nis: string | null
  created_at: string
  updated_at: string
}

export interface ListPendaftarItem {
  id: string
  user_id: string
  psb_setting_id: string
  gender: string
  program: string | null
  status: PendaftarStatus
  nis: string | null
  created_at: string
}

export interface ListPendaftarQuery {
  status?: string
  psb_setting_id?: string
  page?: number
  limit?: number
}

// ===== Dokumen =====

export interface DokumenPresignRequest {
  stage: DokumenStage
  kind: DokumenKind
  filename: string
  content_type: string
}

export interface DokumenPresignResponse {
  presign_url: string
  key: string
  public_url: string | null
}

export interface DokumenConfirmRequest {
  stage: DokumenStage
  kind: DokumenKind
  key: string
}

export interface DokumenConfirmResponse {
  id: string
}

export interface DokumenItemResponse {
  id: string
  stage: DokumenStage
  kind: DokumenKind
  status: DokumenStatus
  original_filename: string | null
  mime_type: string | null
  size: number | null
  notes: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

export interface DokumenAccessResponse {
  access_url: string
  expires_in: number
}

// ===== Review =====

export interface ReviewResponse {
  id: string
  pendaftar_id: string
  stage: ReviewStage
  action: ReviewAction
  notes: string | null
  reviewed_by: string
  created_at: string
}

// ===== Settings =====

export type PsbQuota = Record<string, number>

export interface PsbBankAccount {
  name: string
  no: string
}

export interface CreateSettingRequest {
  name: string
  start_period: string
  end_period: string
  quota?: PsbQuota
  reg_fee?: number
  bank_accounts?: PsbBankAccount[]
}

export interface UpdateSettingRequest {
  name?: string
  start_period?: string
  end_period?: string
  status?: PsbSettingStatus
  quota?: PsbQuota
  reg_fee?: number
  bank_accounts?: PsbBankAccount[]
}

export interface SettingResponse {
  id: string
  name: string
  start_period: string
  end_period: string
  status: PsbSettingStatus
  quota: PsbQuota
  reg_fee: number
  bank_accounts: PsbBankAccount[]
  data_purged_at: string | null
  created_at: string
  updated_at: string
}

// ===== Generic =====

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface MessageResponse {
  message: string
}
