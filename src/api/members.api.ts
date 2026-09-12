import client from './client'
import type { ApiResponse, CursorResponse } from '@/types/api'
import type { MemberDailyStat, MemberDetail, MemberListQuery, MemberSummary } from '@/types/member'

export const membersApi = {
  async list(params: MemberListQuery) {
    const { data } = await client.get<ApiResponse<CursorResponse<MemberSummary>>>('/members', { params })
    return data.data
  },
  async get(memberId: string) {
    const { data } = await client.get<ApiResponse<MemberDetail>>(`/members/${memberId}`)
    return data.data
  },
  async updateStatus(memberId: string, status: 'SUSPENDED' | 'ACTIVE', reason?: string) {
    await client.patch(`/members/${memberId}/status`, { status, reason })
  },
  async withdraw(memberId: string) {
    await client.post(`/members/${memberId}/withdrawal`)
  },
  async stats(from: string, to: string) {
    const { data } = await client.get<ApiResponse<MemberDailyStat[]>>('/members/stats', { params: { from, to } })
    return data.data
  },
}
