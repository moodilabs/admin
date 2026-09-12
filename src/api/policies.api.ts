import client from './client'
import type { ApiResponse } from '@/types/api'
import type { PolicyDetail, PolicyRequest, PolicySummary, PolicyType } from '@/types/support'

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
  /** 시행 전(effectiveAt > today) 버전만 수정 가능 — POLICY_ALREADY_EFFECTIVE 409 */
  async update(id: number, body: PolicyRequest) {
    await client.put(`/policies/${id}`, body)
  },
  async remove(id: number) {
    await client.delete(`/policies/${id}`)
  },
}
