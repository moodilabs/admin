/** AdminAuditLogResponse — 관리자 API 호출 기록(변경 요청만 남는다) */
export interface AuditLog {
  id: number
  adminId: string
  method: string
  path: string
  statusCode: number
  requestId: string
  createdAt: string
}

/** ApiRequestLogResponse — 앱 API 요청 기록(모든 메서드·결과) */
export interface ApiRequestLog {
  id: number
  memberId: string | null
  memberNickname: string | null
  memberEmail: string | null
  method: string
  path: string
  statusCode: number
  durationMs: number
  requestId: string | null
  createdAt: string
}

export interface ApiRequestLogQuery {
  memberId?: string
  method?: string
  path?: string
  /** 2 · 4 · 5 — 응답 코드 백의 자리 */
  statusClass?: number
  cursor?: string
  size?: number
}
