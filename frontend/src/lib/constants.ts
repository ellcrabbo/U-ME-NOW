export const CITY = 'Jakarta'

export const BROAD_AREAS = [
  'Central Jakarta',
  'South Jakarta',
  'West Jakarta',
  'North Jakarta',
  'East Jakarta',
  'Tangerang',
  'Bekasi'
] as const
export type BroadArea = (typeof BROAD_AREAS)[number]

export const INTENTS = ['Chat', 'Meet', 'Date', 'Casual'] as const
export type Intent = (typeof INTENTS)[number]

export const REPORT_REASONS = [
  'Fake or spam profile',
  'Harassment or hate',
  'Inappropriate or explicit content',
  'Underage user',
  'Scam or solicitation',
  'Threat or safety concern',
  'Other'
] as const

export const MAX_PHOTOS = 3
export const BIO_MAX = 240

// Activity windows (kept in sync with DB logic)
export const ONLINE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const STORAGE_BUCKET = 'profile-photos'
