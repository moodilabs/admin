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

/** 백엔드 member.domain.AgreementType — 가입 시 동의 항목 */
export type AgreementType = 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'AGE_OVER_14' | 'MARKETING'
/** 백엔드 member.domain.WithdrawalReason — ADMIN_FORCED는 어드민 강제 탈퇴 */
export type WithdrawalReason =
  | 'NOT_USED_MUCH' | 'RECOMMENDATION_MISMATCH' | 'HARD_TO_USE' | 'FOUND_ANOTHER_APP' | 'OTHER' | 'ADMIN_FORCED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

/**
 * AdminMemberDetailResponse.AgreementResponse.
 * policy*는 동의 당시 시행 중이던 약관 버전 스냅샷 — V29 이전 동의·시행본이 없던 종류는 null
 */
export interface MemberAgreement {
  type: AgreementType
  agreed: boolean
  agreedAt: string | null
  policyId: number | null
  policyVersion: string | null
  policyLocale: string | null
}

export interface MemberWithdrawal {
  reasons: WithdrawalReason[]
  detail: string | null
  withdrawnAt: string
}

/** AdminMemberDetailResponse */
export interface MemberDetail extends MemberSummary {
  country: string | null
  birthYear: number | null
  gender: Gender | null
  preferredMoods: string[]
  agreements: MemberAgreement[]
  savedSpotCount: number
  routeCount: number
  inquiryCount: number
  suspendedAt: string | null
  suspendReason: string | null
  deletedAt: string | null
  withdrawal: MemberWithdrawal | null
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
