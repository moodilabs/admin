import client from './client'
import type { ApiResponse, CursorResponse } from '@/types/api'
import type { MoodTag, SpotDetail, SpotListQuery, SpotStatus, SpotSummary } from '@/types/spot'

export const spotsApi = {
  async list(params: SpotListQuery) {
    const { data } = await client.get<ApiResponse<CursorResponse<SpotSummary>>>('/spots', { params })
    return data.data
  },
  async get(spotId: number) {
    const { data } = await client.get<ApiResponse<SpotDetail>>(`/spots/${spotId}`)
    return data.data
  },
  /** SUPER 전용. HIDDEN·DELETED는 reason 필수 */
  async updateStatus(spotId: number, status: SpotStatus, reason?: string) {
    await client.patch(`/spots/${spotId}/status`, { status, reason })
  },
  async updateRouteExclusion(spotId: number, excluded: boolean) {
    await client.patch(`/spots/${spotId}/route-exclusion`, { excluded })
  },
  async updateMoods(spotId: number, moodTags: MoodTag[]) {
    await client.put(`/spots/${spotId}/moods`, { moodTags })
  },
  async updateDescription(spotId: number, content: string) {
    await client.put(`/spots/${spotId}/description`, { content })
  },
}
