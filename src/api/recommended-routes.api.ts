import client from './client'
import type { ApiResponse } from '@/types/api'
import type { RecommendedRoute, RecommendedRouteRequest } from '@/types/curation'

export const recommendedRoutesApi = {
  /** 숨김 포함 전체, sortOrder ASC */
  async list() {
    const { data } = await client.get<ApiResponse<RecommendedRoute[]>>('/recommended-routes')
    return data.data
  },
  async get(id: number) {
    const { data } = await client.get<ApiResponse<RecommendedRoute>>(`/recommended-routes/${id}`)
    return data.data
  },
  /** 스팟이 PUBLISHED가 아니면 SPOT_NOT_AVAILABLE 400 */
  async create(body: RecommendedRouteRequest) {
    const { data } = await client.post<ApiResponse<{ id: number }>>('/recommended-routes', body)
    return data.data.id
  },
  async update(id: number, body: RecommendedRouteRequest) {
    await client.put(`/recommended-routes/${id}`, body)
  },
  /** 숨김 항목을 포함한 전체 ID를 원하는 순서로 */
  async reorder(ids: number[]) {
    await client.put('/recommended-routes/order', { ids })
  },
  async updateVisibility(id: number, visible: boolean) {
    await client.patch(`/recommended-routes/${id}/visibility`, { visible })
  },
  async remove(id: number) {
    await client.delete(`/recommended-routes/${id}`)
  },
}
