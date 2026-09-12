import client from './client'
import type { ApiResponse, CursorResponse } from '@/types/api'
import type { InquiryDetail, InquiryListQuery, InquirySummary } from '@/types/support'

export const inquiriesApi = {
  async list(params: InquiryListQuery) {
    const { data } = await client.get<ApiResponse<CursorResponse<InquirySummary>>>('/inquiries', { params })
    return data.data
  },
  async get(id: number) {
    const { data } = await client.get<ApiResponse<InquiryDetail>>(`/inquiries/${id}`)
    return data.data
  },
  async answer(id: number, content: string) {
    await client.put(`/inquiries/${id}/answer`, { content })
  },
  async countReceived() {
    const { data } = await client.get<ApiResponse<{ count: number }>>('/inquiries/count', { params: { status: 'RECEIVED' } })
    return data.data.count
  },
}
