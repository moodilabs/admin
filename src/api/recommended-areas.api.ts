import client from './client'
import type { ApiResponse } from '@/types/api'
import type { AreaSuggestion, RecommendedArea, RecommendedAreaRequest } from '@/types/curation'

export const recommendedAreasApi = {
  /** sortOrder ASC */
  async list() {
    const { data } = await client.get<ApiResponse<RecommendedArea[]>>('/recommended-areas')
    return data.data
  },
  /** 스팟이 실제로 있는 지역만. 키워드 2자 미만이면 빈 목록 */
  async suggest(keyword: string) {
    const { data } = await client.get<ApiResponse<AreaSuggestion[]>>('/recommended-areas/suggest', { params: { keyword } })
    return data.data
  },
  /** 자동완성 원장에 없는 지역이면 INVALID_REQUEST 400 */
  async create(body: RecommendedAreaRequest) {
    const { data } = await client.post<ApiResponse<{ id: number }>>('/recommended-areas', body)
    return data.data.id
  },
  async update(id: number, body: RecommendedAreaRequest) {
    await client.put(`/recommended-areas/${id}`, body)
  },
  /** 전체 ID를 원하는 순서로 */
  async reorder(ids: number[]) {
    await client.put('/recommended-areas/order', { ids })
  },
  async remove(id: number) {
    await client.delete(`/recommended-areas/${id}`)
  },
}
