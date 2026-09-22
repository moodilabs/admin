import client from './client'
import type { ApiResponse, CursorResponse } from '@/types/api'
import type { ApiRequestLog, ApiRequestLogQuery, AuditLog } from '@/types/audit'

export const auditApi = {
  /** 페이지 크기는 서버 고정(100) */
  async list(params: { adminId?: string; cursor?: string }) {
    const { data } = await client.get<ApiResponse<CursorResponse<AuditLog>>>('/audit-logs', { params })
    return data.data
  },
  /** 앱 API 요청 로그 */
  async apiLogs(params: ApiRequestLogQuery) {
    const { data } = await client.get<ApiResponse<CursorResponse<ApiRequestLog>>>('/api-logs', { params })
    return data.data
  },
}
