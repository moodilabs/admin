import client from './client'
import type { ApiResponse, CursorResponse } from '@/types/api'
import type { InquiryDetail, InquiryListQuery, InquirySummary } from '@/types/support'

export const inquiriesApi = {
  async list(params: InquiryListQuery) {
    const { data } = await client.get<ApiResponse<CursorResponse<InquirySummary>>>('/inquiries', { params })
    return data.data
  },
  async get(id: string) {
    const { data } = await client.get<ApiResponse<InquiryDetail>>(`/inquiries/${id}`)
    return data.data
  },
  /** 재호출 시 덮어쓰기. 5,000자 이내 */
  async answer(id: string, content: string) {
    await client.put(`/inquiries/${id}/answer`, { content })
  },
  async countReceived() {
    const { data } = await client.get<ApiResponse<{ count: number }>>('/inquiries/count')
    return data.data.count
  },
}
