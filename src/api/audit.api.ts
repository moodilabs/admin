import client from './client'
import type { ApiResponse, CursorResponse } from '@/types/api'
import type { AuditLog } from '@/types/audit'

export const auditApi = {
  /** SUPER 전용. 페이지 크기는 서버 고정(100) */
  async list(params: { adminId?: string; cursor?: string }) {
    const { data } = await client.get<ApiResponse<CursorResponse<AuditLog>>>('/audit-logs', { params })
    return data.data
  },
}
