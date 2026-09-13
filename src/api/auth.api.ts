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
  /** 성공하면 서버가 리프레시 토큰을 모두 지운다 — 액세스 토큰 만료 후 재로그인 필요 */
  async changePassword(body: AdminPasswordChangeRequest) {
    await client.patch('/me/password', body)
  },
}
