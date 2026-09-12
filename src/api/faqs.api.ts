import client from './client'
import type { ApiResponse } from '@/types/api'
import type { FaqCategory, FaqCategoryRequest, FaqRequest } from '@/types/support'

export const faqsApi = {
  async listAll() {
    const { data } = await client.get<ApiResponse<FaqCategory[]>>('/faqs')
    return data.data
  },
  // 카테고리
  async createCategory(body: FaqCategoryRequest) {
    await client.post('/faq-categories', body)
  },
  async updateCategory(id: number, body: FaqCategoryRequest) {
    await client.put(`/faq-categories/${id}`, body)
  },
  async reorderCategories(ids: number[]) {
    await client.put('/faq-categories/order', { ids })
  },
  async removeCategory(id: number) {
    await client.delete(`/faq-categories/${id}`)
  },
  // 항목
  async create(body: FaqRequest) {
    await client.post('/faqs', body)
  },
  async update(id: number, body: FaqRequest) {
    await client.put(`/faqs/${id}`, body)
  },
  async reorder(categoryId: number, ids: number[]) {
    await client.put(`/faq-categories/${categoryId}/faqs/order`, { ids })
  },
  async remove(id: number) {
    await client.delete(`/faqs/${id}`)
  },
}
