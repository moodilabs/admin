export type AdminRole = 'SUPER' | 'OPERATOR'
export type AdminAccountStatus = 'ACTIVE' | 'DISABLED'

export interface AdminLoginRequest {
  loginId: string
  password: string
}

/** AdminTokenResponse */
export interface AdminTokenResponse {
  accessToken: string
  refreshToken: string
  role: AdminRole
  /** 초기 비밀번호 상태 — true면 비밀번호를 바꾸기 전까지 다른 관리자 API가 403 */
  passwordChangeRequired: boolean
}

/** AdminAccountResponse — GET /me 와 GET /accounts 항목이 같은 형태 */
export interface AdminAccount {
  id: string
  /** 영문 소문자·숫자·밑줄 4~20자 */
  loginId: string
  name: string
  role: AdminRole
  status: AdminAccountStatus
  passwordChangeRequired: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type AdminMe = AdminAccount

/** 비밀번호는 10자 이상 */
export interface AdminAccountCreateRequest {
  loginId: string
  password: string
  name: string
  role: AdminRole
}

/** 새 비밀번호는 10자 이상, 현재 비밀번호와 달라야 한다 */
export interface AdminPasswordChangeRequest {
  currentPassword: string
  newPassword: string
}
