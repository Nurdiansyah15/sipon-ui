import type { DokumenKind, DokumenStatus } from './Dokumen'

export interface SantriItem {
  id: string
  user_id: string
  nis?: string | null
  fullname?: string | null
  username: string
  email: string
  status: string
  created_at: string
}

export interface CreateSantriRequest {
  nis: string
  program_id?: string | null
}

export interface CreateSantriResponse {
  user_id: string
  santri_id: string
  nis: string
  generated_password: string
}

export interface ListSantriQuery {
  page?: number
  limit?: number
  sort_by?: string
  sort_type?: string
  nis?: string
}

export interface ImportSantriResultItem {
  row_number: number
  nis: string
  status: 'success' | 'error'
  message?: string
  user_id?: string
  santri_id?: string
  generated_password?: string
}

export interface ImportSantriResponse {
  items: ImportSantriResultItem[]
  success_count: number
  error_count: number
}

export type SantriRequestStatus = 'pending' | 'approved' | 'rejected'

export interface SantriRequestItem {
  id: string
  user_id: string
  username: string
  fullname?: string | null
  email: string
  status: SantriRequestStatus
  notes?: string | null
  created_at: string
}

export interface ListSantriRequestsQuery {
  page?: number
  limit?: number
  sort_by?: string
  sort_type?: string
  status?: string
}

export interface ApproveSantriRequestPayload {
  nis: string
  program_id?: string | null
}

export interface RejectSantriRequestPayload {
  notes?: string
}

export interface DokumenItem {
  id: string
  kind: DokumenKind
  key: string
  status: DokumenStatus
  original_filename?: string | null
  mime_type?: string | null
  size?: number | null
  notes?: string | null
  verified_by?: string | null
  verified_at?: string | null
  created_at: string
}

export interface RejectDokumenPayload {
  notes?: string
}

// ── Self-service (santri's own profile/documents) ───────────────────────────

export interface SantriProfile {
  id: string
  user_id: string
  nis?: string | null
  status?: string | null
  username: string
  email: string
  fullname?: string | null
  avatar_url?: string | null

  nickname?: string | null
  program?: string | null
  option?: string | null
  hobby?: string | null
  purpose?: string | null
  motivation_entry?: string | null
  pob?: string | null
  dob?: string | null
  blood?: string | null

  address?: string | null
  sub_district?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null

  previous_pondok_name?: string | null
  previous_pondok_address?: string | null
  previous_pondok_div?: string | null
  previous_pondok_time?: string | null

  nik?: string | null
  no_kk?: string | null
  nisn?: string | null
  no_kip?: string | null
  no_kks?: string | null
  no_pkh?: string | null

  workplace?: string | null
  department?: string | null

  home_status?: string | null

  father?: string | null
  father_pn?: string | null
  father_nik?: string | null
  father_job?: string | null
  father_graduate?: string | null
  father_income?: string | null

  mother?: string | null
  mother_pn?: string | null
  mother_nik?: string | null
  mother_job?: string | null
  mother_graduate?: string | null
  mother_income?: string | null

  guardian_relationship?: string | null
  guardian?: string | null
  guardian_pn?: string | null
  guardian_nik?: string | null
  guardian_job?: string | null
  guardian_graduate?: string | null
  guardian_income?: string | null

  created_at: string
  updated_at: string
}

// UpdateSantriProfileRequest deliberately excludes nis/username/email/phone —
// those are identity-owned identifiers, not part of the profile-update scope
// (mirrors sipon-be's UpdateSantriRequest).
export interface UpdateSantriProfileRequest {
  fullname?: string
  nickname?: string
  program?: string
  hobby?: string
  purpose?: string
  motivation_entry?: string
  pob?: string
  dob?: string
  blood?: string

  address?: string
  sub_district?: string
  district?: string
  province?: string
  postal_code?: string

  previous_pondok_name?: string
  previous_pondok_address?: string
  previous_pondok_div?: string
  previous_pondok_time?: string

  nik?: string
  no_kk?: string
  nisn?: string
  no_kip?: string
  no_kks?: string
  no_pkh?: string

  workplace?: string
  department?: string

  home_status?: string

  father?: string
  father_pn?: string
  father_nik?: string
  father_job?: string
  father_graduate?: string
  father_income?: string

  mother?: string
  mother_pn?: string
  mother_nik?: string
  mother_job?: string
  mother_graduate?: string
  mother_income?: string

  guardian_relationship?: string
  guardian?: string
  guardian_pn?: string
  guardian_nik?: string
  guardian_job?: string
  guardian_graduate?: string
  guardian_income?: string
}

export interface RequestSantriResult {
  id: string
  message: string
}

export interface DokumenPresignPayload {
  content_type: string
  kind: DokumenKind
}

export interface SantriDokumenPresignResponse {
  presign_url: string
  key: string
  expires_in: number
}

export interface DokumenConfirmPayload {
  kind: DokumenKind
  key: string
  original_filename?: string
  mime_type?: string
  size?: number
}

export interface SantriDokumenConfirmResponse {
  id: string
  kind: DokumenKind
  key: string
  status: DokumenStatus
  created_at: string
}

export interface DokumenAccessResult {
  access_url: string
  expires_in: number
}
