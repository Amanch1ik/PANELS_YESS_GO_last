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

// Token storage helpers
const ACCESS_KEY = 'yessgo_access_token'
const REFRESH_KEY = 'yessgo_refresh_token'

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}
function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setAuthToken(accessToken: string | null, refreshToken: string | null = null) {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    localStorage.setItem(ACCESS_KEY, accessToken)
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem(ACCESS_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken)
  } else if (refreshToken === null) {
    // do nothing when null passed explicitly
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
}

export async function login(username: string, password: string) {
  // For admin login, we use Username instead of Phone
  const loginData = {
    Username: username,
    Password: password
  }

  try {
    const resp = await api.post(API_ENDPOINTS.auth.adminLogin, loginData)
    const d = resp.data || {}
    // The API returns AccessToken and RefreshToken in PascalCase
    const access = d.AccessToken || d.token || d.accessToken || d.access_token
    const refresh = d.RefreshToken || d.refreshToken || d.refresh_token
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
  if (!refreshToken) throw new Error('No refresh token available')

  // The API expects RefreshToken in PascalCase
  const refreshData = {
    RefreshToken: refreshToken,
    refreshToken: refreshToken, // fallback
    refresh_token: refreshToken  // fallback
  }

  try {
    const resp = await api.post(API_ENDPOINTS.auth.refresh, refreshData)
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
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      if (isRefreshing) {
        // queue request
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      isRefreshing = true
      try {
        const token = await attemptRefresh()
        // flush queue
        refreshQueue.forEach(q => q.resolve(token))
        refreshQueue = []
        isRefreshing = false
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshErr) {
        refreshQueue.forEach(q => q.reject(refreshErr))
        refreshQueue = []
        isRefreshing = false
        // clear tokens
        setAuthToken(null, null)
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
