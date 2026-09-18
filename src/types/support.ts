// ── 공지 (AdminNoticeResponse) ──
/** 백엔드 support.domain.NoticeType — 앱은 제목 앞에 [유형]으로 표시 */
export type NoticeType = 'ANNOUNCEMENT' | 'MAINTENANCE' | 'UPDATE' | 'ISSUE' | 'EVENT' | 'OTHER'

export interface Notice {
  id: number
  type: NoticeType
  title: string
  content: string
  visible: boolean
  /** YYYY-MM-DD */
  publishedAt: string
}

export interface NoticeRequest {
  type: NoticeType
  title: string
  content: string
  visible: boolean
  /** YYYY-MM-DD, 미지정 시 오늘 */
  publishedAt?: string
}

// ── FAQ (AdminFaqCategoryResponse / AdminFaqItemResponse) ──
export interface FaqItem {
  id: number
  question: string
  answer: string
  sortOrder: number
  visible: boolean
}

export interface FaqCategory {
  id: number
  name: string
  sortOrder: number
  visible: boolean
  items: FaqItem[]
}

export interface FaqCategoryRequest {
  name: string
  visible: boolean
}

export interface FaqRequest {
  categoryId: number
  question: string
  answer: string
  visible: boolean
}

// ── 약관 (AdminPolicySummaryResponse / AdminPolicyDetailResponse) ──
/** 백엔드 support.domain.PolicyType — 가입 약관(AgreementType)과 1:1. MARKETING은 선택 동의 문서 */
export type PolicyType = 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'MARKETING'
/** 중복 기준은 (type, version, locale). 앱 기본은 en-US */
export type PolicyLocale = 'ko-KR' | 'en-US'

export interface PolicySummary {
  id: number
  type: PolicyType
  version: string
  /** YYYY-MM-DD */
  effectiveAt: string
  locale: PolicyLocale
  /** 시행 활성 — 꺼지면 시행일이 지나도 "현재 시행본"으로 잡히지 않는다 */
  enabled: boolean
  /** 앱 약관보기 노출 */
  visible: boolean
  /** 동의한 회원이 있으면 true — 수정·삭제 불가 */
  agreed: boolean
}

export interface PolicyDetail extends PolicySummary {
  content: string
}

export interface PolicyRequest {
  type: PolicyType
  version: string
  content: string
  effectiveAt: string
  locale: PolicyLocale
  enabled: boolean
  visible: boolean
}

/** PATCH /policies/{id}/publication — 시행된 버전도 바꿀 수 있는 유일한 필드 */
export interface PolicyPublicationRequest {
  enabled: boolean
  visible: boolean
}

// ── 1:1 문의 (AdminInquirySummaryResponse / AdminInquiryDetailResponse) ──
export type InquiryStatus = 'RECEIVED' | 'ANSWERED'
export type InquiryTopic =
  | 'ACCOUNT' | 'RECOMMENDATIONS' | 'ROUTES' | 'SPOT_INFORMATION'
  | 'TECHNICAL_ISSUES' | 'FEEDBACK_SUGGESTIONS' | 'OTHER'

/** 탈퇴 회원은 withdrawn=true 에 nickname·email null. member 자체가 null 인 경우도 방어 */
export interface InquiryMember {
  id: string
  nickname: string | null
  email: string | null
  withdrawn: boolean
}

export interface InquirySummary {
  id: string
  topic: InquiryTopic
  subject: string
  status: InquiryStatus
  createdAt: string
  answeredAt: string | null
  member: InquiryMember | null
}

export interface InquiryAttachment {
  url: string
  contentType: string
}

export interface InquiryAnswer {
  content: string
  answeredBy: string
  answeredAt: string
}

export interface InquiryDetail {
  id: string
  topic: InquiryTopic
  subject: string
  content: string
  status: InquiryStatus
  createdAt: string
  attachments: InquiryAttachment[]
  member: InquiryMember | null
  answer: InquiryAnswer | null
}

export interface InquiryListQuery {
  status?: InquiryStatus
  topic?: InquiryTopic
  cursor?: string
  size?: number
}
