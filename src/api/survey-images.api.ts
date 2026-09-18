import client from './client'
import type { ApiResponse } from '@/types/api'
import type { SurveyImage, SurveyImageRequest } from '@/types/curation'

export const surveyImagesApi = {
  /** sortOrder ASC */
  async list() {
    const { data } = await client.get<ApiResponse<SurveyImage[]>>('/survey-images')
    return data.data
  },
  /** imageUrl이 해당 스팟에 등록된 이미지가 아니거나 스팟이 PUBLISHED가 아니면 SPOT_NOT_AVAILABLE 400 */
  async create(body: SurveyImageRequest) {
    const { data } = await client.post<ApiResponse<{ id: number }>>('/survey-images', body)
    return data.data.id
  },
  async update(id: number, body: SurveyImageRequest) {
    await client.put(`/survey-images/${id}`, body)
  },
  /** 전체 ID를 원하는 순서로 */
  async reorder(ids: number[]) {
    await client.put('/survey-images/order', { ids })
  },
  /** 사전조사 연결만 지운다 — 원본 스팟 이미지는 그대로 */
  async remove(id: number) {
    await client.delete(`/survey-images/${id}`)
  },
}
