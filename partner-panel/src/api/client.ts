import axios from 'axios'

// Use Vite environment variable for API base URL with fallback
const API_BASE = ((import.meta as any).env?.VITE_API_BASE) ||
                 'https://api.yessgo.org/api/v1'

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
    // Add access token to request headers if available
    const accessToken = localStorage.getItem('partner_access_token')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Token storage helpers for partner
const PARTNER_ACCESS_KEY = 'partner_access_token'
const PARTNER_REFRESH_KEY = 'partner_refresh_token'

export function getStoredPartnerToken(): string | null {
  return localStorage.getItem(PARTNER_ACCESS_KEY)
}

export function setPartnerToken(accessToken: string | null, refreshToken: string | null = null) {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    localStorage.setItem(PARTNER_ACCESS_KEY, accessToken)
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem(PARTNER_ACCESS_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(PARTNER_REFRESH_KEY, refreshToken)
  } else if (refreshToken === null) {
    // do nothing when null passed explicitly
  } else {
    localStorage.removeItem(PARTNER_REFRESH_KEY)
  }
}

export async function partnerLogin(email: string, password: string) {
  try {
    const resp = await api.post('/partner/auth/login', { email, password })
    const d = resp.data || {}
    const access = d.accessToken || d.token || d.access_token
    if (access) {
      setPartnerToken(access, d.refreshToken || d.refresh_token)
    }
    return d
  } catch (err: any) {
    throw err
  }
}

// Partner-specific API functions
export async function fetchPartnerProfile() {
  const resp = await api.get('/partner/profile')
  return resp.data
}

export async function fetchPartnerStats() {
  const resp = await api.get('/partner/stats')
  return resp.data
}

export async function fetchPartnerProducts() {
  const resp = await api.get('/partner/products')
  return resp.data
}

export async function fetchPartnerCustomers() {
  const resp = await api.get('/partner/customers')
  return resp.data
}

export async function fetchPartnerSales() {
  const resp = await api.get('/partner/sales')
  return resp.data
}

export async function updatePartnerProduct(id: string | number, payload: Record<string, any>) {
  // Check if demo user - simulate API call
  if (getStoredPartnerToken()?.includes('demo')) {
    return new Promise(resolve => setTimeout(() => resolve({
      success: true,
      product: { id, ...payload }
    }), 300))
  }

  const resp = await api.put(`/partner/products/${id}`, payload)
  return resp.data
}

export async function createPartnerProduct(payload: Record<string, any>) {
  const resp = await api.post('/partner/products', payload)
  return resp.data
}

export default api
