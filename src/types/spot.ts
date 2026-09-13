import type { CursorQuery } from './api'

export type SpotStatus = 'TAGGING_PENDING' | 'PUBLISHED' | 'HIDDEN' | 'DELETED'
export type SpotContentType =
  | 'TOURIST_ATTRACTION' | 'CULTURAL_FACILITY' | 'FESTIVAL' | 'LEISURE_SPORTS'
  | 'ACCOMMODATION' | 'SHOPPING' | 'RESTAURANT'
export type MoodTag =
  | 'NATURE' | 'OCEAN' | 'CITYSCAPE' | 'RIVERSIDE' | 'COUNTRYSIDE' | 'EXPANSIVE' | 'TRADITIONAL' | 'LOCAL'
  | 'RETRO' | 'INDUSTRIAL' | 'MODERN' | 'COZY' | 'SERENE' | 'LIVELY' | 'ROMANTIC' | 'MOODY'
  | 'GOLDEN_HOUR' | 'NEON' | 'ARTSY' | 'SEASONAL'

export interface SpotListQuery extends CursorQuery {
  keyword?: string
  status?: SpotStatus
  area?: string
}

/** AdminSpotSummaryResponse */
export interface SpotSummary {
  id: number
  title: string | null
  contentType: SpotContentType
  area: string | null
  district: string | null
  status: SpotStatus
  routeExcluded: boolean
  bookmarkCount: number
  createdAt: string
  statusChangedAt: string | null
}

/** AdminSpotDetailResponse */
export interface SpotDetail {
  id: number
  contentId: string
  source: string
  contentType: SpotContentType
  area: string | null
  district: string | null
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
  tel: string | null
  homepage: string | null
  status: SpotStatus
  statusReason: string | null
  statusChangedAt: string | null
  routeExcluded: boolean
  translation: { title: string | null; overview: string | null; addr1: string | null; addr2: string | null } | null
  description: string | null
  mood: { tags: MoodTag[]; confidence: number | null } | null
  images: { url: string; primary: boolean; sortOrder: number }[]
  bookmarkCount: number
  createdAt: string
  updatedAt: string
}
