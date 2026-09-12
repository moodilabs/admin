/** SUSPENDED·WITHDRAWN 은 ADM-F04 에서 추가되는 값 (WITHDRAWN 은 deleted_at 기반 가상 상태) */
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'
export type Provider = 'GOOGLE' | 'APPLE'

export interface MemberSummary {
  id: string
  nickname: string | null
  email: string | null
  provider: Provider
  status: MemberStatus
  createdAt: string
}

export interface MemberDetail extends MemberSummary {
  country: string | null
  preferredMoods: string[]
  policyAgreements: { type: string; agreedAt: string }[]
  bookmarkCount: number
  routeCount: number
  inquiryCount: number
  suspendedAt: string | null
  suspendReason: string | null
  deletedAt: string | null
  withdrawalReason: string | null
}

export interface MemberListQuery {
  keyword?: string
  status?: MemberStatus
  provider?: Provider
  cursor?: string
  size?: number
}

export interface MemberDailyStat {
  date: string
  joined: number
  withdrawn: number
}
