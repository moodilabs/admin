import client from './client'
import type { ApiResponse } from '@/types/api'
import type { AdminAccount, AdminAccountCreateRequest, AdminAccountStatus } from '@/types/auth'

export const accountsApi = {
  async list() {
    const { data } = await client.get<ApiResponse<AdminAccount[]>>('/accounts')
    return data.data
  },
  async create(body: AdminAccountCreateRequest) {
    await client.post('/accounts', body)
  },
  async updateStatus(id: string, status: AdminAccountStatus) {
    await client.patch(`/accounts/${id}/status`, { status })
  },
}
