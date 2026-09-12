import client from './client'
import type { ApiResponse } from '@/types/api'
import type { AdminLoginRequest, AdminMe, AdminTokenResponse } from '@/types/auth'

export const authApi = {
  async login(body: AdminLoginRequest) {
    const { data } = await client.post<ApiResponse<AdminTokenResponse>>('/auth/login', body)
    return data.data
  },
  async logout() {
    await client.post('/auth/logout')
  },
  async me() {
    const { data } = await client.get<ApiResponse<AdminMe>>('/me')
    return data.data
  },
}
