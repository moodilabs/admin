import type { MoodTag } from './spot'

// ── 추천 루트 (RecommendedRouteService.View / Command) ──
/** 일차(day) 1~5 · 일차별 순서(sequence) 1~6, 각각 1부터 연속 */
export interface RecommendedRouteStop {
  spotId: number
  day: number
  sequence: number
}

export interface RecommendedRoute {
  id: number
  title: string
  imageUrl: string
  region: string
  visible: boolean
  sortOrder: number
  stops: RecommendedRouteStop[]
}

export interface RecommendedRouteRequest {
  title: string
  imageUrl: string
  region: string
  visible: boolean
  sortOrder: number
  stops: RecommendedRouteStop[]
}

export const RECOMMENDED_ROUTE_MAX_DAYS = 5
export const RECOMMENDED_ROUTE_MAX_SPOTS_PER_DAY = 6
export const RECOMMENDED_ROUTE_MAX_STOPS = 30

// ── 추천 지역 (RecommendedAreaService.View / Command · AreaSuggestResponse) ──
/** 백엔드 discovery.domain.PickAreaLevel */
export type AreaLevel = 'REGION' | 'DISTRICT' | 'NEIGHBORHOOD'

/** 자동완성 결과 — level·region·district·neighborhood는 등록 요청에 그대로 되돌려 보낸다 */
export interface AreaSuggestion {
  level: AreaLevel
  region: string
  district: string | null
  neighborhood: string | null
  label: string
}

export interface RecommendedArea extends AreaSuggestion {
  id: number
  sortOrder: number
}

export interface RecommendedAreaRequest extends AreaSuggestion {
  sortOrder: number
}

// ── 사전조사 이미지 (SurveyImageService.View / Command) ──
/** 무드 하나를 대표할 스팟 이미지. imageUrl은 그 스팟(`GET /spots/{id}`)의 images 중 하나여야 한다 */
export interface SurveyImage {
  id: number
  mood: MoodTag
  spotId: number
  imageUrl: string
  sortOrder: number
}

export interface SurveyImageRequest {
  mood: MoodTag
  spotId: number
  imageUrl: string
  sortOrder: number
}
