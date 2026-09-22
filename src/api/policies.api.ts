import client from './client'
import type { ApiResponse } from '@/types/api'
import type { PolicyDetail, PolicyPublicationRequest, PolicyRequest, PolicySummary, PolicyType } from '@/types/support'

export const policiesApi = {
  async list(type?: PolicyType) {
    const { data } = await client.get<ApiResponse<PolicySummary[]>>('/policies', { params: { type } })
    return data.data
  },
  async get(id: number) {
    const { data } = await client.get<ApiResponse<PolicyDetail>>(`/policies/${id}`)
    return data.data
  },
  async create(body: PolicyRequest) {
    const { data } = await client.post<ApiResponse<{ id: number }>>('/policies', body)
    return data.data.id
  },
  /** 시행·동의 여부와 무관하게 수정 가능 */
  async update(id: number, body: PolicyRequest) {
    await client.put(`/policies/${id}`, body)
  },
  /** 시행 여부 · 공개 상태는 시행된 버전도 변경 가능 */
  async updatePublication(id: number, body: PolicyPublicationRequest) {
    await client.patch(`/policies/${id}/publication`, body)
  },
  async remove(id: number) {
    await client.delete(`/policies/${id}`)
  },
}
