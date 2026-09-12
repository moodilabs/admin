export type AdminRole = 'SUPER' | 'OPERATOR'
export type AdminAccountStatus = 'ACTIVE' | 'DISABLED'

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminTokenResponse {
  accessToken: string
  refreshToken: string
  role: AdminRole
}

export interface AdminMe {
  id: string
  email: string
  name: string
  role: AdminRole
}

export interface AdminAccount {
  id: string
  email: string
  name: string
  role: AdminRole
  status: AdminAccountStatus
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminAccountCreateRequest {
  email: string
  name: string
  role: AdminRole
  password: string
}
