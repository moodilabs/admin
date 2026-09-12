import { isAxiosError } from 'axios'
import type { ProblemDetail } from '@/types/api'

/** ProblemDetail의 detail → 없으면 기본 메시지 */
export function getErrorMessage(error: unknown, fallback = '요청 처리 중 오류가 발생했습니다.'): string {
  if (isAxiosError<ProblemDetail>(error)) {
    return error.response?.data?.detail ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function getErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ProblemDetail>(error)) {
    return error.response?.data?.code
  }
  return undefined
}
