export type AdminRole = 'SUPER' | 'OPERATOR'
export type AdminAccountStatus = 'ACTIVE' | 'DISABLED'

export interface AdminLoginRequest {
  email: string
  password: string
}

/** AdminTokenResponse */
export interface AdminTokenResponse {
  accessToken: string
  refreshToken: string
  role: AdminRole
}

/** AdminAccountResponse — GET /me 와 GET /accounts 항목이 같은 형태 */
export interface AdminAccount {
  id: string
  email: string
  name: string
  role: AdminRole
  status: AdminAccountStatus
  lastLoginAt: string | null
  createdAt: string
}

export type AdminMe = AdminAccount

/** 비밀번호는 10자 이상 */
export interface AdminAccountCreateRequest {
  email: string
  password: string
  name: string
  role: AdminRole
}
