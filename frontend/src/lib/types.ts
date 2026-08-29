export type AccountStatus = 'active' | 'suspended' | 'banned'
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'

export interface Profile {
  id: string
  display_name: string | null
  public_age: number | null
  city: string
  bio: string | null
  intents: string[]
  discoverable: boolean
  onboarding_complete: boolean
  account_status: AccountStatus
  last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface ProfilePrivate {
  id: string
  date_of_birth: string | null
  broad_area: string | null
  consent_terms_at: string | null
  consent_privacy_at: string | null
  consent_guidelines_at: string | null
  privacy_settings: Record<string, unknown>
}

export interface ProfilePhoto {
  id: string
  user_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

// Row returned by the secure discover() RPC. Note: NO broad_area is ever
// returned — only a computed is_nearby boolean.
export interface DiscoverRow {
  id: string
  display_name: string
  public_age: number
  city: string
  bio: string | null
  intents: string[]
  last_active_at: string
  is_nearby: boolean
  photo_paths: string[]
}

export interface ConversationRow {
  conversation_id: string
  match_id: string
  other_user_id: string
  other_display_name: string | null
  other_photo_path: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface ReportRow {
  id: string
  reporter_id: string
  reported_user_id: string
  message_id: string | null
  photo_id: string | null
  reason: string
  details: string | null
  status: ReportStatus
  created_at: string
}

export interface ModerationAction {
  id: string
  admin_id: string
  affected_user_id: string
  action: string
  reason: string | null
  created_at: string
}
