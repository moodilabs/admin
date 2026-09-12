import client from './client'
import type { ApiResponse } from '@/types/api'
import type { Dashboard } from '@/types/dashboard'

export const dashboardApi = {
  async get() {
    const { data } = await client.get<ApiResponse<Dashboard>>('/dashboard')
    return data.data
  },
}
