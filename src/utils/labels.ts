import type { MemberStatus, Provider } from '@/types/member'
import type { InquiryStatus, InquiryTopic, NoticeType, PolicyType } from '@/types/support'
import type { AdminRole } from '@/types/auth'
import type { MoodTag, SpotContentType, SpotStatus } from '@/types/spot'

export type Tone = 'gray' | 'green' | 'yellow' | 'red' | 'blue'

export const memberStatusLabel: Record<MemberStatus, string> = {
  PENDING: '온보딩 중', ACTIVE: '활성', SUSPENDED: '정지', WITHDRAWN: '탈퇴',
}
export const memberStatusTone: Record<MemberStatus, Tone> = {
  PENDING: 'yellow', ACTIVE: 'green', SUSPENDED: 'red', WITHDRAWN: 'gray',
}
export const providerLabel: Record<Provider, string> = { GOOGLE: '구글', APPLE: '애플' }

export const noticeTypeLabel: Record<NoticeType, string> = {
  ANNOUNCEMENT: '공지', MAINTENANCE: '점검', UPDATE: '업데이트', ISSUE: '장애', EVENT: '이벤트', OTHER: '기타',
}

export const policyTypeLabel: Record<PolicyType, string> = {
  TERMS_OF_SERVICE: '서비스 이용약관',
  PRIVACY_POLICY: '개인정보 처리방침',
}

export const inquiryStatusLabel: Record<InquiryStatus, string> = { RECEIVED: '접수', ANSWERED: '답변완료' }

export const inquiryTopicLabel: Record<InquiryTopic, string> = {
  ACCOUNT: '계정',
  RECOMMENDATIONS: '추천',
  ROUTES: '루트',
  SPOT_INFORMATION: '스팟 정보',
  TECHNICAL_ISSUES: '기술 문제',
  FEEDBACK_SUGGESTIONS: '피드백·제안',
  OTHER: '기타',
}

export const spotStatusLabel: Record<SpotStatus, string> = {
  TAGGING_PENDING: '태깅 대기', PUBLISHED: '노출', HIDDEN: '숨김', DELETED: '삭제',
}
export const spotStatusTone: Record<SpotStatus, Tone> = {
  TAGGING_PENDING: 'yellow', PUBLISHED: 'green', HIDDEN: 'gray', DELETED: 'red',
}
export const spotContentTypeLabel: Record<SpotContentType, string> = {
  TOURIST_ATTRACTION: '관광지', CULTURAL_FACILITY: '문화시설', FESTIVAL: '축제·공연', LEISURE_SPORTS: '레포츠',
  ACCOMMODATION: '숙박', SHOPPING: '쇼핑', RESTAURANT: '음식점',
}
export const moodTagLabel: Record<MoodTag, string> = {
  NATURE: '자연', OCEAN: '바다', CITYSCAPE: '도심·야경', RIVERSIDE: '강변·호수', COUNTRYSIDE: '전원·시골',
  EXPANSIVE: '광활·탁 트인', TRADITIONAL: '전통·한옥', LOCAL: '동네·생활감', RETRO: '레트로·뉴트로',
  INDUSTRIAL: '인더스트리얼', MODERN: '모던', COZY: '아늑', SERENE: '힐링', LIVELY: '활기', ROMANTIC: '낭만',
  MOODY: '무드', GOLDEN_HOUR: '노을', NEON: '네온·야경', ARTSY: '예술', SEASONAL: '계절감',
}

export const adminRoleLabel: Record<AdminRole, string> = { SUPER: '슈퍼', OPERATOR: '운영자' }

export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }))
}
