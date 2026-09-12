import client from './client'
import type { ApiResponse, CursorQuery, CursorResponse } from '@/types/api'
import type { Notice, NoticeRequest, NoticeType } from '@/types/support'

export interface NoticeListQuery extends CursorQuery {
  type?: NoticeType
  visible?: boolean
}

export const noticesApi = {
  async list(params: NoticeListQuery) {
    const { data } = await client.get<ApiResponse<CursorResponse<Notice>>>('/notices', { params })
    return data.data
  },
  async get(id: number) {
    const { data } = await client.get<ApiResponse<Notice>>(`/notices/${id}`)
    return data.data
  },
  async create(body: NoticeRequest) {
    await client.post('/notices', body)
  },
  async update(id: number, body: NoticeRequest) {
    await client.put(`/notices/${id}`, body)
  },
  async updateVisibility(id: number, visible: boolean) {
    await client.patch(`/notices/${id}/visibility`, { visible })
  },
  async remove(id: number) {
    await client.delete(`/notices/${id}`)
  },
}
