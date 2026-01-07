import axios from 'axios'
import { API_ENDPOINTS } from "../config/apiEndpoints"

// Use Vite environment variable for API base URL; default to empty string to enable dev proxy
const API_BASE = (((import.meta as any).env?.VITE_API_BASE) ?? '')

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
})

// Request interceptor to validate tokens before making calls
api.interceptors.request.use(
  config => {
    // For auth endpoints, don't validate tokens (they handle their own logic)
    if (config.url?.includes('/auth/')) {
      return config
    }

    // Check if we have valid tokens before making the request
    if (!hasValidTokens()) {
      console.warn('🚫 Attempting API call without valid tokens, request will likely fail')
      // Don't block the request, let the response interceptor handle it
    }

    return config
  },
  error => Promise.reject(error)
)

// Token storage helpers
const ACCESS_KEY = 'yessgo_access_token'
const REFRESH_KEY = 'yessgo_refresh_token'

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}
function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

// Token validation helper
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch (error) {
    console.warn('Error parsing token:', error)
    return true // Consider invalid tokens as expired
  }
}

// Check if we have valid tokens
export function hasValidTokens(): boolean {
  const accessToken = getStoredAccessToken()
  const refreshToken = getStoredRefreshToken()

  if (!accessToken || !refreshToken) {
    return false
  }

  // Check if access token is expired
  if (isTokenExpired(accessToken)) {
    console.log('Access token is expired')
    return false
  }

  // Check if refresh token is expired (optional, but good practice)
  if (isTokenExpired(refreshToken)) {
    console.log('Refresh token is expired')
    return false
  }

  return true
}

// Proactive token refresh - call this before making multiple API calls
export async function ensureValidTokens(): Promise<boolean> {
  if (hasValidTokens()) {
    return true
  }

  // Check if access token is expired but refresh token is still valid
  const accessToken = getStoredAccessToken()
  const refreshToken = getStoredRefreshToken()

  if (refreshToken && !isTokenExpired(refreshToken)) {
    if (!accessToken || isTokenExpired(accessToken)) {
      console.log('🔄 Access token expired, attempting proactive refresh...')
      try {
        await attemptRefresh()
        console.log('✅ Proactive token refresh successful')
        return true
      } catch (error) {
        console.error('❌ Proactive token refresh failed:', error)
        return false
      }
    }
  }

  return false
}

export function setAuthToken(accessToken: string | null, refreshToken: string | null = null) {
  console.log('🔑 setAuthToken called:', { accessToken: !!accessToken, refreshToken: !!refreshToken })
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    localStorage.setItem(ACCESS_KEY, accessToken)
    console.log('✅ Access token saved to localStorage')
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem(ACCESS_KEY)
    console.log('🗑️ Access token removed from localStorage')
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken)
    console.log('✅ Refresh token saved to localStorage')
  } else if (refreshToken === null) {
    // do nothing when null passed explicitly
  } else {
    localStorage.removeItem(REFRESH_KEY)
    console.log('🗑️ Refresh token removed from localStorage')
  }
}

export async function login(username: string, password: string) {
  // For admin login, we use Username instead of Phone
  const loginData = {
    Username: username,
    Password: password
  }

  try {
    console.log('🔐 Attempting admin login...')
    const resp = await api.post(API_ENDPOINTS.auth.adminLogin, loginData)
    const d = resp.data || {}
    console.log('📥 Login response:', d)
    // The API returns AccessToken and RefreshToken in PascalCase
    const access = d.AccessToken || d.token || d.accessToken || d.access_token
    const refresh = d.RefreshToken || d.refreshToken || d.refresh_token
    console.log('🔑 Tokens found:', { access: !!access, refresh: !!refresh })
    if (access) {
      setAuthToken(access, refresh || null)
    }
    return d
  } catch (err: any) {
    // Debug: log failed attempt details
    if (err?.response?.data) {
      // eslint-disable-next-line no-console
      console.warn('Login failed', err.response.data)
    }
    throw err
  }
}

export async function fetchPartners() {
  const resp = await api.get(API_ENDPOINTS.partners.list)
  return resp.data
}

export async function fetchMessages() {
  const resp = await api.get(API_ENDPOINTS.messages.list)
  return resp.data
}

export async function fetchUsers() {
  const resp = await api.get(API_ENDPOINTS.users.list)
  return resp.data
}

export async function fetchProducts() {
  const resp = await api.get(API_ENDPOINTS.products.list)
  return resp.data
}

export async function createProduct(payload: Record<string, any>) {
  const resp = await api.post(API_ENDPOINTS.products.create, payload)
  return resp.data
}

export async function updateProduct(id: string | number, payload: Record<string, any>) {
  const resp = await api.put(API_ENDPOINTS.products.update(id), payload)
  return resp.data
}

export async function deleteProduct(id: string | number) {
  const resp = await api.delete(API_ENDPOINTS.products.delete(id))
  return resp.data
}

// Refresh token flow
let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void, reject: (err: any) => void }> = []

async function attemptRefresh(): Promise<string> {
  const refreshToken = getStoredRefreshToken()
  console.log('🔄 Attempting token refresh, refresh token exists:', !!refreshToken)
  if (!refreshToken) throw new Error('No refresh token available')

  // The API expects RefreshToken in PascalCase
  const refreshData = {
    RefreshToken: refreshToken,
    refreshToken: refreshToken, // fallback
    refresh_token: refreshToken  // fallback
  }

  try {
    console.log('📤 Sending refresh request...')
    const resp = await api.post(API_ENDPOINTS.auth.refresh, refreshData)
    console.log('📥 Refresh response:', resp.data)
    const d = resp.data || {}
    // The API returns AccessToken in PascalCase
    const access = d.AccessToken || d.access_token || d.token || d.accessToken
    const refresh = d.RefreshToken || d.refresh_token || d.refreshToken
    if (access) {
      setAuthToken(access, refresh || null)
      return access
    }
  } catch (err: any) {
    // Debug: log failed refresh attempt
    if (err?.response?.data) {
      // eslint-disable-next-line no-console
      console.warn('Refresh failed', err.response.data)
    }
    throw err
  }

  throw new Error('Refresh failed - no access token returned')
}

// Axios response interceptor to handle 401 -> try refresh once
api.interceptors.response.use(
  r => r,
  async err => {
    const originalRequest = err.config
    if (!originalRequest) return Promise.reject(err)

    // Only handle 401 errors for requests that aren't already retried
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      console.log('🚨 401 error detected, attempting token refresh...')
      originalRequest._retry = true

      // Don't attempt refresh for auth endpoints (would cause infinite loop)
      if (originalRequest.url?.includes('/auth/')) {
        console.log('🚫 Auth endpoint failed, not attempting refresh')
        setAuthToken(null, null)
        window.location.href = '/'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        console.log('🔄 Refresh already in progress, queuing request...')
        // queue request
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(queueErr => {
          console.error('🚨 Queued request failed:', queueErr)
          return Promise.reject(queueErr)
        })
      }

      isRefreshing = true
      console.log('🔄 Starting token refresh process...')

      try {
        const token = await attemptRefresh()
        console.log('✅ Token refresh successful, retrying original request...')

        // flush queue
        refreshQueue.forEach(q => q.resolve(token))
        refreshQueue = []
        isRefreshing = false

        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshErr: any) {
        console.error('❌ Token refresh failed:', refreshErr.message)

        refreshQueue.forEach(q => q.reject(refreshErr))
        refreshQueue = []
        isRefreshing = false

        // Only clear tokens and redirect for non-auth related failures
        if (refreshErr.response?.status === 401) {
          console.warn('🔐 Refresh token invalid/expired, clearing tokens and redirecting...')
          setAuthToken(null, null)
          // Small delay to show error message before redirect
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        }

        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(err)
  }
)

export default api

export async function getPartner(id: string | number) {
  const resp = await api.get(`/partners/${id}`)
  return resp.data
}

export async function createPartner(payload: Record<string, any>) {
  // Use partner registration endpoint instead of admin endpoint
  const resp = await api.post('/partner/auth/register', payload)
  return resp.data
}

export async function updatePartner(id: string | number, payload: Record<string, any>) {
  const resp = await api.put(`/partners/${id}`, payload)
  return resp.data
}

export async function deletePartner(id: string | number) {
  const resp = await api.delete(`/partners/${id}`)
  return resp.data
}

export async function uploadPartnerImage(partnerId: string | number, file: File) {
  const form = new FormData()
  form.append('file', file)
  // endpoint may vary; this is a common pattern
  const resp = await api.post(`/partners/${partnerId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return resp.data
}

export async function uploadProductImage(productId: string | number, file: File) {
  const form = new FormData()
  form.append('file', file)
  const resp = await api.post(`/products/${productId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return resp.data
}

export async function fetchPartnerProducts(partnerId: string | number) {
  const resp = await api.get(API_ENDPOINTS.partners.products.list(partnerId))
  return resp.data
}

export async function createPartnerProduct(partnerId: string | number, payload: Record<string, any>) {
  const resp = await api.post(API_ENDPOINTS.partners.products.create(partnerId), payload)
  return resp.data
}

export async function updatePartnerProduct(partnerId: string | number, productId: string | number, payload: Record<string, any>) {
  const resp = await api.put(API_ENDPOINTS.partners.products.update(partnerId, productId), payload)
  return resp.data
}

export async function deletePartnerProduct(partnerId: string | number, productId: string | number) {
  const resp = await api.delete(API_ENDPOINTS.partners.products.delete(partnerId, productId))
  return resp.data
}

export async function uploadPartnerProductImage(partnerId: string | number, productId: string | number, file: File) {
  const form = new FormData()
  form.append('file', file)
  const resp = await api.post(API_ENDPOINTS.partners.products.images(partnerId, productId), form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return resp.data
}

export async function getUserBalance(userId: string | number) {
  try {
    const resp = await api.get(`/admin/users/${userId}/balance`)
    return resp.data
  } catch (error: any) {
    console.warn(`❌ Ошибка загрузки баланса пользователя ${userId}:`, error.message)
    // В случае ошибки возвращаем пустой баланс
    return {
      balance: 0,
      transactions: 0,
      points: 0
    }
  }
}

// Эти функции будут реализованы при подключении к реальному API
// export async function getUserTransactions(userId: string | number, limit: number = 10) {
//   const resp = await api.get(`/admin/users/${userId}/transactions?limit=${limit}`)
//   return resp.data
// }

// export async function updateUserStatus(userId: string | number, isActive: boolean) {
//   const resp = await api.patch(`/admin/users/${userId}/status`, { is_active: isActive })
//   return resp.data
// }
