// ===== Enums / status literals =====

export type FeedbackCategory = 'saran' | 'pengaduan' | 'pertanyaan' | 'apresiasi' | 'lainnya'

// ===== Users =====

export interface FeedbackUser {
  user_id: string
  username: string
  email: string
  fullname: string | null
}

// ===== Feedbacks =====

export interface FeedbackItem {
  id: string
  user: FeedbackUser | null
  title: string
  body: string
  category: FeedbackCategory
  is_takedown: boolean
  takedown_reason: string | null
  like_count: number
  comment_count: number
  is_liked: boolean
  attachment_count: number
  created_at: string
  updated_at: string
}

export interface FeedbackDetail extends FeedbackItem {
  attachments: FeedbackAttachment[]
  is_owner: boolean
}

export interface CreateFeedbackRequest {
  title: string
  body: string
  category: FeedbackCategory
}

export interface UpdateFeedbackRequest {
  title: string
  body: string
  category: FeedbackCategory
}

export interface ListFeedbackQuery {
  category?: FeedbackCategory | string
  search?: string
  page?: number
  limit?: number
}

// ===== Comments =====

export interface FeedbackComment {
  id: string
  feedback_id: string
  user: FeedbackUser | null
  body: string
  reply_to_id: string | null
  reply_to_user: FeedbackUser | null
  is_takedown: boolean
  takedown_reason: string | null
  like_count: number
  is_liked: boolean
  is_owner: boolean
  created_at: string
  updated_at: string
}

export interface CreateCommentRequest {
  body: string
  reply_to_id?: string
}

// ===== Attachments =====

export interface FeedbackAttachment {
  id: string
  key: string
  original_filename?: string | null
  mime_type?: string | null
  size?: number | null
  download_url?: string
  created_at: string
}

export interface AttachmentPresignResponse {
  presign_url: string
  key: string
  public_url?: string
}

export interface AttachmentConfirmRequest {
  key: string
  original_filename: string
  mime_type: string
  size: number
}

// ===== Likes =====

export interface ToggleLikeResponse {
  liked: boolean
  like_count: number
}

// ===== Generic =====
