/** SuccessResponse.of(data) */
export interface ApiResponse<T> {
  data: T
}

/** CursorResponse<T> — 커서 페이징 */
export interface CursorResponse<T> {
  items: T[]
  nextCursor: string | null
  hasNext: boolean
}

/** PageResponse<T> — 오프셋 페이징 */
export interface PageResponse<T> {
  data: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/** GlobalExceptionHandler — RFC 9457 ProblemDetail + code */
export interface ProblemDetail {
  type?: string
  title: string
  status: number
  detail: string
  instance?: string
  timestamp: string
  code: string
}

export interface CursorQuery {
  cursor?: string
  size?: number
}
