import client from './client'
import type { ApiResponse } from '@/types/api'
import type { AdminLoginRequest, AdminMe, AdminPasswordChangeRequest, AdminTokenResponse } from '@/types/auth'

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
  async changePassword(body: AdminPasswordChangeRequest) {
    await client.patch('/me/password', body)
  },
}
