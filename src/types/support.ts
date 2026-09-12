// ── 공지 ──
export type NoticeType = 'NOTICE' | 'EVENT' | 'UPDATE'

export interface Notice {
  id: number
  type: NoticeType
  title: string
  content: string
  visible: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface NoticeRequest {
  type: NoticeType
  title: string
  content: string
  visible: boolean
  publishedAt?: string
}

// ── FAQ ──
export interface Faq {
  id: number
  categoryId: number
  question: string
  answer: string
  visible: boolean
  sortOrder: number
}

export interface FaqCategory {
  id: number
  name: string
  visible: boolean
  sortOrder: number
  faqs: Faq[]
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

// ── 약관 ──
export type PolicyType = 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'LOCATION' | 'MARKETING'

export interface Policy {
  id: number
  type: PolicyType
  version: string
  content: string
  effectiveAt: string
  createdAt: string
}

export interface PolicyRequest {
  type: PolicyType
  version: string
  content: string
  effectiveAt: string
}

// ── 1:1 문의 ──
export type InquiryStatus = 'RECEIVED' | 'ANSWERED'

export interface InquirySummary {
  id: number
  topic: string
  title: string
  status: InquiryStatus
  memberNickname: string | null
  memberEmail: string | null
  createdAt: string
  answeredAt: string | null
}

export interface InquiryDetail extends InquirySummary {
  content: string
  attachmentUrls: string[]
  answer: string | null
  answeredBy: string | null
}

export interface InquiryListQuery {
  status?: InquiryStatus
  topic?: string
  cursor?: string
  size?: number
}
