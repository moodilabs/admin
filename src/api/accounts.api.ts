import client from './client'
import type { ApiResponse } from '@/types/api'
import type { AdminAccount, AdminAccountCreateRequest, AdminAccountStatus, AdminRole } from '@/types/auth'

export const accountsApi = {
  async list() {
    const { data } = await client.get<ApiResponse<AdminAccount[]>>('/accounts')
    return data.data
  },
  async create(body: AdminAccountCreateRequest) {
    const { data } = await client.post<ApiResponse<{ id: string }>>('/accounts', body)
    return data.data.id
  },
  async updateStatus(id: string, status: AdminAccountStatus) {
    await client.patch(`/accounts/${id}/status`, { status })
  },
  async updateRole(id: string, role: AdminRole) {
    await client.patch(`/accounts/${id}/role`, { role })
  },
}
