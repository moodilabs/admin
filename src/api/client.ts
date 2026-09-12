import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '@/utils/token'
import type { ApiResponse, ProblemDetail } from '@/types/api'
import type { AdminTokenResponse } from '@/types/auth'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/admin`

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 수행하고, 나머지는 그 결과를 기다린다.
let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

function onRefreshResolved(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function redirectToLogin() {
  tokenStorage.clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ProblemDetail>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }
    // 로그인/재발급 자체의 401은 재시도하지 않는다
    if (originalRequest.url?.startsWith('/auth/')) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      redirectToLogin()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((token) => {
          if (!token) return reject(error)
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(client(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true
    try {
      const { data } = await axios.post<ApiResponse<AdminTokenResponse>>(
        `${BASE_URL}/auth/reissue`,
        { refreshToken },
      )
      tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken)
      onRefreshResolved(data.data.accessToken)
      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
      return client(originalRequest)
    } catch (refreshError) {
      onRefreshResolved(null)
      redirectToLogin()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default client
