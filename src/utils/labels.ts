import type { MemberStatus, Provider } from '@/types/member'
import type { InquiryStatus, NoticeType, PolicyType } from '@/types/support'
import type { AdminRole } from '@/types/auth'

export type Tone = 'gray' | 'green' | 'yellow' | 'red' | 'blue'

export const memberStatusLabel: Record<MemberStatus, string> = {
  PENDING: '온보딩 중', ACTIVE: '활성', SUSPENDED: '정지', WITHDRAWN: '탈퇴',
}
export const memberStatusTone: Record<MemberStatus, Tone> = {
  PENDING: 'yellow', ACTIVE: 'green', SUSPENDED: 'red', WITHDRAWN: 'gray',
}
export const providerLabel: Record<Provider, string> = { KAKAO: '카카오', APPLE: '애플', GOOGLE: '구글' }

export const noticeTypeLabel: Record<NoticeType, string> = { NOTICE: '공지', EVENT: '이벤트', UPDATE: '업데이트' }

export const policyTypeLabel: Record<PolicyType, string> = {
  TERMS_OF_SERVICE: '서비스 이용약관',
  PRIVACY_POLICY: '개인정보 처리방침',
  LOCATION: '위치기반서비스 이용약관',
  MARKETING: '마케팅 정보 수신',
}

export const inquiryStatusLabel: Record<InquiryStatus, string> = { RECEIVED: '접수', ANSWERED: '답변완료' }

export const adminRoleLabel: Record<AdminRole, string> = { SUPER: '슈퍼', OPERATOR: '운영자' }

export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }))
}
