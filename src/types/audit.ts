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
