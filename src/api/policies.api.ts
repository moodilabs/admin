import client from './client'
import type { ApiResponse } from '@/types/api'
import type { Policy, PolicyRequest, PolicyType } from '@/types/support'

export const policiesApi = {
  async list(type?: PolicyType) {
    const { data } = await client.get<ApiResponse<Policy[]>>('/policies', { params: { type } })
    return data.data
  },
  async get(id: number) {
    const { data } = await client.get<ApiResponse<Policy>>(`/policies/${id}`)
    return data.data
  },
  async create(body: PolicyRequest) {
    await client.post('/policies', body)
  },
  /** 시행 전(effectiveAt > today) 버전만 수정 가능 — POLICY_ALREADY_EFFECTIVE 409 */
  async update(id: number, body: PolicyRequest) {
    await client.put(`/policies/${id}`, body)
  },
  async remove(id: number) {
    await client.delete(`/policies/${id}`)
  },
}
