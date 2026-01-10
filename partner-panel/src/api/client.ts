import axios from 'axios'

// Use Vite environment variable for API base URL with fallback
// In development we leave it empty so Vite proxy can forward requests to the real API.
const API_BASE = ((import.meta as any).env?.VITE_API_BASE) ||
                 (((import.meta as any).env?.DEV) ? '' : 'https://api.yessgo.org/api/v1')

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
})

// Simple in-memory cache for GET requests
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes
const getCacheKey = (method: string, url: string, params?: any) => `${method.toUpperCase()}:${url}:${JSON.stringify(params||{})}`
const cacheStore: Record<string, { data: any; ts: number }> = {}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseRetryAfter(value: any) {
  if (!value) return 5
  try {
    const v = String(value).trim().toLowerCase()
    if (v.endsWith('s')) return parseInt(v.slice(0,-1),10) || 5
    if (v.endsWith('m')) return (parseInt(v.slice(0,-1),10) || 1) * 60
    const n = parseInt(v,10)
    if (!isNaN(n)) return n
  } catch (e) {}
  return 5
}

async function requestWithRetry(config: any, retries = 3) {
  try {
    const resp = await api.request(config)
    return resp.data
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 429 && retries > 0) {
      const retryAfter = parseRetryAfter(err?.response?.data?.retry_after || err?.response?.headers?.['retry-after'])
      await sleep(retryAfter * 1000)
      return requestWithRetry(config, retries - 1)
    }
    throw err
  }
}

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
  const key = getCacheKey('get','/partner/profile')
  const cached = cacheStore[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  const data = await requestWithRetry({ method: 'get', url: '/partner/profile' })
  cacheStore[key] = { data, ts: Date.now() }
  return data
}

export async function fetchPartnerStats() {
  const key = getCacheKey('get','/partner/stats')
  const cached = cacheStore[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  const data = await requestWithRetry({ method: 'get', url: '/partner/stats' })
  cacheStore[key] = { data, ts: Date.now() }
  return data
}

export async function fetchPartnerProducts() {
  const key = getCacheKey('get','/partner/products')
  const cached = cacheStore[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  const data = await requestWithRetry({ method: 'get', url: '/partner/products' })
  cacheStore[key] = { data, ts: Date.now() }
  return data
}

export async function fetchPartnerCustomers() {
  const key = getCacheKey('get','/partner/customers')
  const cached = cacheStore[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  const data = await requestWithRetry({ method: 'get', url: '/partner/customers' })
  cacheStore[key] = { data, ts: Date.now() }
  return data
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
