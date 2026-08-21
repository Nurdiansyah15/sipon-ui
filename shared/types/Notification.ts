export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  image_url?: string
  module: string
  event_type: string
  entity_id: string
  click_action: string
  bypass: boolean
  extra?: Record<string, string>
  is_read: boolean
  created_at: string
  read_at?: string
}

export interface UnreadCountResponse {
  count: number
}

export interface NotificationPreference {
  id: string
  user_id: string
  all_notifications_enabled: boolean
  do_not_disturb_enabled: boolean
  do_not_disturb_start_time?: string
  do_not_disturb_end_time?: string
  created_at: string
  updated_at: string
}

export interface UpdateNotificationPreferenceRequest {
  all_notifications_enabled?: boolean
  do_not_disturb_enabled?: boolean
  do_not_disturb_start_time?: string
  do_not_disturb_end_time?: string
}

export interface ListNotificationsQuery {
  unread_only?: boolean
  page?: number
  limit?: number
}

export type NotificationType = 'system' | 'social' | 'content' | 'reminder' | 'security'
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms'

export interface BroadcastRequest {
  type: NotificationType
  title: string
  body: string
  channels: NotificationChannel[]
}
