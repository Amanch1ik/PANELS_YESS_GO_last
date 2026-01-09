import axios from 'axios'
import { API_ENDPOINTS } from "../config/apiEndpoints"

// Use Vite environment variable for API base URL with fallback
// Priority: VITE_API_BASE > environment-specific URLs > default
const API_BASE = ((import.meta as any).env?.VITE_API_BASE) ||
                 ((import.meta as any).env?.PROD ? 'https://api.yessgo.org/api/v1' :
                  ((import.meta as any).env?.DEV ? '' : 'https://api.yessgo.org/api/v1'))

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

    // Add access token to request headers if available
    const accessToken = getStoredAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
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
      return false
    }

    // Check if refresh token is expired (optional, but good practice)
    if (isTokenExpired(refreshToken)) {
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
      try {
        await attemptRefresh()
        return true
      } catch (error) {
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

// Кэш для данных API
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут
const cache = {
  partners: { data: null, timestamp: 0 },
  users: { data: null, timestamp: 0 },
  products: { data: null, timestamp: 0 }
}
const STORAGE_PREFIX = 'yessgo_cache_v1_'
// Кэш для товаров партнёров по id
const partnerProductsCache: Record<string, { data: any; timestamp: number }> = {}

function getCachedData(key: string) {
  const cached = cache[key as keyof typeof cache]
  // First check in-memory cache
  if (cached.data && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Используем кэшированные данные (memory) для ${key}`)
    return cached.data
  }
  // Try persistent storage
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log(`📦 Используем кэшированные данные (localStorage) для ${key}`)
        // hydrate memory cache
        cache[key as keyof typeof cache] = { data: parsed.data, timestamp: parsed.timestamp }
        return parsed.data
      } else {
        // stale - remove
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
      }
    }
  } catch (e) {
    console.warn('⚠️ Ошибка чтения кэша из localStorage', e)
  }
  return null
}

function setCachedData(key: string, data: any) {
  const entry = { data, timestamp: Date.now() }
  cache[key as keyof typeof cache] = entry
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry))
  } catch (e) {
    console.warn('⚠️ Не удалось записать кэш в localStorage', e)
  }
}

export function clearApiCache() {
  console.log('🗑️ Очищаем кэш API')
  cache.partners = { data: null, timestamp: 0 }
  cache.users = { data: null, timestamp: 0 }
  cache.products = { data: null, timestamp: 0 }
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}partners`)
    localStorage.removeItem(`${STORAGE_PREFIX}users`)
    localStorage.removeItem(`${STORAGE_PREFIX}products`)
    // remove partner products entries
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(`${STORAGE_PREFIX}partnerProducts-`)) {
        localStorage.removeItem(k)
      }
    })
  } catch (e) {
    console.warn('⚠️ Ошибка при очистке persistent cache', e)
  }
}

// Helpers to handle 429 Retry-After and schedule background refreshes
const scheduledRefreshes: Record<string, number | null> = {}

function parseRetryAfter(headerValue: any): number {
  // Return seconds. Accept formats: "60", "60s", "1m", "120"
  if (!headerValue) return 60
  try {
    const v = String(headerValue).trim().toLowerCase()
    if (v.endsWith('s')) return Math.max(1, parseInt(v.slice(0, -1), 10) || 60)
    if (v.endsWith('m')) return Math.max(1, (parseInt(v.slice(0, -1), 10) || 1) * 60)
    const n = parseInt(v, 10)
    if (!isNaN(n)) return Math.max(1, n)
  } catch (e) {
    // fallthrough
  }
  return 60
}

function scheduleBackgroundFetch(key: string, fn: () => Promise<any>, retryAfterSeconds: number) {
  try {
    const ms = Math.min(Math.max(retryAfterSeconds * 1000, 2000), 5 * 60 * 1000) // clamp 2s..5min
    if (scheduledRefreshes[key]) {
      // already scheduled
      return
    }
    console.log(`⏱️ Scheduling background refresh for ${key} in ${Math.round(ms / 1000)}s`)
    const timer = window.setTimeout(async () => {
      scheduledRefreshes[key] = null
      try {
        const res = await fn()
        if (res) {
          console.log(`🔁 Background refresh succeeded for ${key}`)
          setCachedData(key, res)
        }
      } catch (e) {
        console.warn(`🔁 Background refresh failed for ${key}:`, e)
        // If failed due to 429 again, don't tight-loop — schedule again with exponential backoff
        const next = Math.min(retryAfterSeconds * 2, 5 * 60)
        scheduleBackgroundFetch(key, fn, next)
      }
    }, ms)
    scheduledRefreshes[key] = timer
  } catch (e) {
    console.warn('Failed to schedule background fetch', e)
  }
}

// Global rate-limit marker to avoid repeated calls during server-side throttling window
let globalRateLimitedUntil = 0
function setGlobalRateLimit(seconds: number) {
  try {
    globalRateLimitedUntil = Date.now() + Math.max(1000, seconds * 1000)
  } catch (e) {
    globalRateLimitedUntil = Date.now() + 60000
  }
}
function isGloballyRateLimited() {
  return Date.now() < globalRateLimitedUntil
}

export async function fetchPartners(params?: Record<string, any>) {
  // Проверяем кэш
  const cachedData = getCachedData('partners')
  if (cachedData) {
    return cachedData
  }
  // Если уже есть глобальная блокировка по rate-limit, возвращаем кеш или пустой результат
  if (isGloballyRateLimited()) {
    console.warn('⏳ Глобальный rate-limit активен — возвращаем кэш (если есть) или пустой список для partners')
    // Schedule a background refresh timed to when the limit expires
    const remaining = Math.max(1, Math.ceil((globalRateLimitedUntil - Date.now()) / 1000))
    scheduleBackgroundFetch('partners', () => fetchPartners(params), remaining)
    return cachedData || []
  }

  try {
    console.log('📥 Загружаем список партнеров...')
    const resp = await api.get(API_ENDPOINTS.partners.list, { params })

    // Проверяем, что ответ содержит данные
    if (resp.data && typeof resp.data === 'object') {
      console.log(`✅ Загружено партнеров:`, Array.isArray(resp.data) ? resp.data.length : 'не массив')
      setCachedData('partners', resp.data)
      return resp.data
    } else {
      console.warn('⚠️ API вернул неожиданный формат данных:', resp.data)
      return []
    }
  } catch (err: any) {
    const status = err?.response?.status
    console.error('❌ Ошибка загрузки партнеров:', status, err?.response?.data)

    // Специальная обработка для известных ошибок
    if (status === 429) {
      // Если есть кэш — используем его и планируем фоновой рефреш после Retry-After
      const retryAfterHeader = err?.response?.data?.retry_after || err?.response?.headers?.['retry-after']
      const retrySeconds = parseRetryAfter(retryAfterHeader)
      setGlobalRateLimit(retrySeconds)
      console.error('🚫 API временно недоступен (слишком много запросов). Retry-After:', retrySeconds, 's')
      if (cachedData) {
        // Schedule background refresh but return cached immediately
        scheduleBackgroundFetch('partners', () => fetchPartners(params), retrySeconds)
        return cachedData
      }
      // Нет кэша — безопасно вернуть пустой массив и планировать фоновую попытку
      scheduleBackgroundFetch('partners', () => fetchPartners(params), retrySeconds)
      return []
    }
    if (status === 401) {
      console.error('🚫 Необходима авторизация для просмотра партнеров')
      throw new Error('Необходима авторизация')
    }
    if (status === 403) {
      console.error('🚫 Недостаточно прав для просмотра партнеров')
      throw new Error('Недостаточно прав доступа')
    }

    // Для других ошибок возвращаем пустой массив вместо краша
    console.warn('⚠️ Возвращаем пустой список партнеров из-за ошибки API')
    return []
  }
}

export async function fetchMessages() {
  const resp = await api.get(API_ENDPOINTS.messages.list)
  return resp.data
}

export async function fetchUsers(params?: Record<string, any>) {
  // Проверяем кэш
  const cachedData = getCachedData('users')
  if (cachedData) {
    return cachedData
  }
  if (isGloballyRateLimited()) {
    console.warn('⏳ Глобальный rate-limit активен — возвращаем кэш (если есть) или пустой список для users')
    const remaining = Math.max(1, Math.ceil((globalRateLimitedUntil - Date.now()) / 1000))
    scheduleBackgroundFetch('users', () => fetchUsers(params), remaining)
    return cachedData || []
  }

  try {
    console.log('📥 Загружаем список пользователей...')
    const resp = await api.get(API_ENDPOINTS.users.list, { params })

    if (resp.data && typeof resp.data === 'object') {
      console.log(`✅ Загружено пользователей:`, Array.isArray(resp.data) ? resp.data.length : 'не массив')
      setCachedData('users', resp.data)
      return resp.data
    } else {
      console.warn('⚠️ API вернул неожиданный формат данных для пользователей:', resp.data)
      return []
    }
  } catch (err: any) {
    const status = err?.response?.status
    console.error('❌ Ошибка загрузки пользователей:', status, err?.response?.data)

    if (status === 429) {
      const retryAfterHeader = err?.response?.data?.retry_after || err?.response?.headers?.['retry-after']
      const retrySeconds = parseRetryAfter(retryAfterHeader)
      setGlobalRateLimit(retrySeconds)
      console.error('🚫 API временно недоступен (слишком много запросов). Retry-After:', retrySeconds, 's')
      if (cachedData) {
        scheduleBackgroundFetch('users', () => fetchUsers(params), retrySeconds)
        return cachedData
      }
      scheduleBackgroundFetch('users', () => fetchUsers(params), retrySeconds)
      return []
    }
    if (status === 401) {
      console.error('🚫 Необходима авторизация для просмотра пользователей')
      throw new Error('Необходима авторизация')
    }
    if (status === 403) {
      console.error('🚫 Недостаточно прав для просмотра пользователей')
      throw new Error('Недостаточно прав доступа')
    }

    console.warn('⚠️ Возвращаем пустой список пользователей из-за ошибки API')
    return []
  }
}

export async function getUser(id: string | number) {
  const resp = await api.get(`${API_ENDPOINTS.users.list}/${id}`)
  return resp.data
}

export async function fetchProducts(params?: Record<string, any>) {
  // Проверяем кэш
  const cachedData = getCachedData('products')
  if (cachedData) {
    return cachedData
  }
  if (isGloballyRateLimited()) {
    console.warn('⏳ Глобальный rate-limit активен — возвращаем кэш (если есть) или пустой список для products')
    const remaining = Math.max(1, Math.ceil((globalRateLimitedUntil - Date.now()) / 1000))
    scheduleBackgroundFetch('products', () => fetchProducts(params), remaining)
    return cachedData || []
  }

  try {
    console.log('📥 Загружаем список продуктов...')
    const resp = await api.get(API_ENDPOINTS.products.list, { params })

    if (resp.data && typeof resp.data === 'object') {
      console.log(`✅ Загружено продуктов:`, Array.isArray(resp.data) ? resp.data.length : 'не массив')
      setCachedData('products', resp.data)
      return resp.data
    } else {
      console.warn('⚠️ API вернул неожиданный формат данных для продуктов:', resp.data)
      return []
    }
  } catch (err: any) {
    const status = err?.response?.status
    console.error('❌ Ошибка загрузки продуктов:', status, err?.response?.data)

    if (status === 429) {
      const retryAfterHeader = err?.response?.data?.retry_after || err?.response?.headers?.['retry-after']
      const retrySeconds = parseRetryAfter(retryAfterHeader)
      setGlobalRateLimit(retrySeconds)
      console.error('🚫 API временно недоступен (слишком много запросов). Retry-After:', retrySeconds, 's')
      if (cachedData) {
        scheduleBackgroundFetch('products', () => fetchProducts(params), retrySeconds)
        return cachedData
      }
      scheduleBackgroundFetch('products', () => fetchProducts(params), retrySeconds)
      return []
    }
    if (status === 401) {
      console.error('🚫 Необходима авторизация для просмотра продуктов')
      throw new Error('Необходима авторизация')
    }
    if (status === 403) {
      console.error('🚫 Недостаточно прав для просмотра продуктов')
      throw new Error('Недостаточно прав доступа')
    }

    console.warn('⚠️ Возвращаем пустой список продуктов из-за ошибки API')
    return []
  }
}

export async function fetchAuditLogs(params?: Record<string, any>) {
  try {
    console.log('📥 Загружаем логи аудита...')

    // Пробуем разные эндпоинты для логов аудита
    const endpoints = [
      '/audit/logs',
      '/admin/audit-logs',
      '/audit-logs',
      '/logs/audit',
      '/admin/logs'
    ]

    let lastError = null

    for (const endpoint of endpoints) {
      try {
        const resp = await api.get(endpoint, { params })

        if (resp.data && typeof resp.data === 'object') {
          console.log(`✅ Загружены логи аудита с ${endpoint}:`, Array.isArray(resp.data) ? resp.data.length : 'не массив')
          return resp.data
        }
      } catch (err: any) {
        lastError = err
        const status = err?.response?.status

        if (status === 404 || status === 405) {
          console.log(`🔄 Эндпоинт ${endpoint} не найден, пробуем следующий...`)
          continue
        }

        if (status === 429) {
          console.error('🚫 API временно недоступен (слишком много запросов). Попробуйте позже.')
          throw new Error('API временно недоступен из-за слишком частых запросов. Попробуйте позже.')
        }

        throw err
      }
    }

    // Если ни один эндпоинт не сработал
    console.warn('⚠️ Не удалось загрузить логи аудита, возвращаем пустой массив')
    return []

  } catch (err: any) {
    const status = err?.response?.status
    console.error('❌ Ошибка загрузки логов аудита:', status, err?.response?.data)

    if (status === 401) {
      console.error('🚫 Необходима авторизация для просмотра логов аудита')
      throw new Error('Необходима авторизация')
    }
    if (status === 403) {
      console.error('🚫 Недостаточно прав для просмотра логов аудита')
      throw new Error('Недостаточно прав доступа')
    }

    console.warn('⚠️ Возвращаем пустой список логов аудита из-за ошибки API')
    return []
  }
}

// Fetch recent activities/events - try common endpoints in order
export async function fetchRecentActivities(limit: number = 10, params?: Record<string, any>) {
  const endpoints = ['/activities', '/events', '/admin/activities', '/admin/events']
  for (const ep of endpoints) {
    try {
      const query = { limit, ...(params || {}) }
      const resp = await api.get(ep, { params: query })
      if (resp.status === 200 && resp.data) {
        return resp.data
      }
    } catch (err: any) {
      // If endpoint not found, try next one; bubble up other errors
      if (err?.response?.status === 404) {
        continue
      }
      throw err
    }
  }
  // If none found, return empty array
  return []
}

export async function fetchTransactions(params?: Record<string, any>) {
  // Add parameters to include user data in transactions
  const enhancedParams: Record<string, any> = {
    ...params,
    // Try different parameter names for including related data
    include: 'user', // Laravel-style
    with: 'user', // Some APIs
    expand: 'user', // OData-style
    populate: 'user', // Strapi-style
    relations: 'user', // Generic
  }

  // Add multiple date parameter variations to improve compatibility
  if (params?.from || params?.date_from || params?.start_date || params?.created_at_from || params?.created_from) {
    const fromDate = params.from || params.date_from || params.start_date || params.created_at_from || params.created_from
    enhancedParams.from = fromDate
    enhancedParams.date_from = fromDate
    enhancedParams.start_date = fromDate
    enhancedParams.created_at_from = fromDate
    enhancedParams.created_from = fromDate
    enhancedParams.date_start = fromDate
    enhancedParams.startDate = fromDate

    // Add timestamp versions if the date looks like a date string
    if (typeof fromDate === 'string' && fromDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const fromDateTime = new Date(fromDate + 'T00:00:00.000Z')
      const fromISOString = fromDateTime.toISOString()
      enhancedParams.from_timestamp = fromISOString
      enhancedParams.start_timestamp = fromISOString
      enhancedParams.created_at_gte = fromISOString
      enhancedParams.date_gte = fromDate
    }
  }

  if (params?.to || params?.date_to || params?.end_date || params?.created_at_to || params?.created_to) {
    const toDate = params.to || params.date_to || params.end_date || params.created_at_to || params.created_to
    enhancedParams.to = toDate
    enhancedParams.date_to = toDate
    enhancedParams.end_date = toDate
    enhancedParams.created_at_to = toDate
    enhancedParams.created_to = toDate
    enhancedParams.date_end = toDate
    enhancedParams.endDate = toDate

    // Add timestamp versions if the date looks like a date string
    if (typeof toDate === 'string' && toDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const toDateTime = new Date(toDate + 'T23:59:59.999Z')
      const toISOString = toDateTime.toISOString()
      enhancedParams.to_timestamp = toISOString
      enhancedParams.end_timestamp = toISOString
      enhancedParams.created_at_lte = toISOString
      enhancedParams.date_lte = toDate
    }
  }

  const endpoints = ['/transactions', '/admin/transactions', '/payments', '/admin/payments']
  for (const ep of endpoints) {
    try {
      const resp = await api.get(ep, { params: enhancedParams })
      if (resp.status === 200 && resp.data) {
        return resp.data
      }
    } catch (err: any) {
      if (err?.response?.status === 404) continue
      throw err
    }
  }
  return { items: [], total: 0 }
}

export async function getTransaction(id: string | number) {
  const endpoints = [`/transactions/${id}`, `/admin/transactions/${id}`, `/payments/${id}`, `/admin/payments/${id}`]
  for (const ep of endpoints) {
    try {
      const resp = await api.get(ep)
      if (resp.status === 200 && resp.data) return resp.data
    } catch (err: any) {
      if (err?.response?.status === 404) continue
      throw err
    }
  }
  throw new Error('Transaction not found')
}

export async function refundTransaction(id: string | number) {
  const endpoints = [`/transactions/${id}/refund`, `/admin/transactions/${id}/refund`, `/payments/${id}/refund`]
  for (const ep of endpoints) {
    try {
      const resp = await api.post(ep)
      if (resp.status >= 200 && resp.status < 300) return resp.data
    } catch (err: any) {
      if (err?.response?.status === 404) continue
      throw err
    }
  }
  // Return special object indicating operation is not supported
  return { error: 'not_supported', message: 'Операция возврата не поддерживается API' }
}

export async function disputeTransaction(id: string | number) {
  const endpoints = [`/transactions/${id}/dispute`, `/admin/transactions/${id}/dispute`, `/payments/${id}/dispute`]
  for (const ep of endpoints) {
    try {
      const resp = await api.post(ep)
      if (resp.status >= 200 && resp.status < 300) return resp.data
    } catch (err: any) {
      if (err?.response?.status === 404) continue
      throw err
    }
  }
  // Return special object indicating operation is not supported
  return { error: 'not_supported', message: 'Операция спора не поддерживается API' }
}

export async function bulkTransactionsAction(ids: Array<string | number>, action: string) {
  // Try common bulk endpoints
  const endpoints = ['/transactions/bulk', '/admin/transactions/bulk', '/payments/bulk']
  for (const ep of endpoints) {
    try {
      const resp = await api.post(ep, { ids, action })
      if (resp.status >= 200 && resp.status < 300) return resp.data
    } catch (err: any) {
      if (err?.response?.status === 404) continue
      throw err
    }
  }
  // As fallback try per-id calls
  for (const id of ids) {
    if (action === 'refund') await refundTransaction(id)
    if (action === 'dispute') await disputeTransaction(id)
  }
  return { success: true }
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

// Временная функция для тестирования API эндпоинтов
export async function testPartnerAPI() {
  const endpoints = [
    '/admin/partners',
    '/partners',
    '/api/admin/partners',
    '/partner/auth/register',
    '/partner/register',
    '/auth/register',
    '/register'
  ]

  console.log('🧪 Тестируем доступные эндпоинты для партнеров...')

  for (const ep of endpoints) {
    try {
      console.log(`🔍 Проверяем GET ${ep}...`)

      // Добавляем задержку между запросами чтобы избежать 429 ошибки
      if (ep === '/partners') {
        console.log('⏳ Ждем 2 секунды перед запросом к /partners...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const resp = await api.get(ep)

      // Проверяем, является ли ответ JSON или HTML
      const isJson = resp.headers['content-type']?.includes('application/json')
      const isHtml = resp.data?.includes?.('<!doctype html>')

      if (isHtml) {
        console.log(`⚠️ GET ${ep} возвращает HTML страницу (не API):`, resp.status)
      } else if (isJson) {
        console.log(`✅ GET ${ep} возвращает JSON API:`, resp.status, resp.data)
      } else {
        console.log(`✅ GET ${ep} доступен:`, resp.status, resp.data)
      }
    } catch (err: any) {
      const status = err?.response?.status
      console.log(`❌ GET ${ep} недоступен:`, status || 'ошибка сети')

      // Специальная обработка для известных ошибок
      if (status === 429) {
        console.log(`🚫 ${ep}: Слишком много запросов. Попробуйте позже.`)
      } else if (status === 405) {
        console.log(`🚫 ${ep}: Метод GET не разрешен (только POST)`)
      } else if (status === 404) {
        console.log(`🚫 ${ep}: Эндпоинт не найден`)
      }
    }

    // Задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('🏁 Тестирование завершено!')
}

export async function createPartner(payload: Record<string, any>) {
  console.log('🚀 Начинаем создание партнера с данными:', payload)

  // Пробуем разные эндпоинты для создания партнеров
  const endpoints = [
    '/admin/partners',           // Админ эндпоинт
    '/partners',                 // Основной эндпоинт
    '/api/admin/partners',       // Полный API путь
    '/partner/create',           // Специальный эндпоинт создания
    '/partners/create',          // Альтернативный путь
    '/api/partners',             // API v1
    '/v1/partners',              // API v1 с версией
    '/partner',                  // Простой путь для создания
    '/partner/new',              // Новый партнер
    '/partners/new',             // Новый партнер
    '/partner/add',              // Добавить партнера
    '/partners/add',             // Добавить партнера
    '/admin/partner',            // Админ партнер
    '/admin/partner/create',     // Админ создание
    '/api/v1/partners',          // API v1 полная версия
    '/api/partner',              // API партнер
    '/api/partner/create',       // API создание партнера
    // Дополнительные варианты
    '/partner/store',            // Store метод (Laravel-style)
    '/partners/store',           // Store метод
    '/partner/save',             // Save метод
    '/partners/save',            // Save метод
    '/admin/partners/store',     // Админ store
    '/api/admin/partners/create', // API админ create
    '/api/v1/admin/partners',    // API v1 админ
    '/admin/api/partners',       // Админ API
    '/partner/api/create',       // Partner API create
    '/partner/management/create', // Management create
    '/business/partners',        // Business partners
    '/business/partner/create',  // Business partner create
  ]

  // Проверяем, что payload содержит необходимые поля
  const requiredFields = ['name', 'category', 'phone', 'password']
  const missingFields = requiredFields.filter(field => !payload[field])

  if (missingFields.length > 0) {
    throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`)
  }

  // Убеждаемся, что у нас есть email
  if (!payload.email) {
    payload.email = `${payload.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}@yessgo.com`
    console.log(`📧 Автоматически сгенерирован email: ${payload.email}`)
  }

  // Добавляем задержку перед первым запросом
  console.log('⏳ Ждем 1 секунду перед созданием партнера...')
  await new Promise(resolve => setTimeout(resolve, 1000))

  let lastError = null

  for (const endpoint of endpoints) {
    // Пробуем сначала POST, затем PUT для каждого эндпоинта
    const methods = ['post', 'put']

    for (const method of methods) {
      try {
        console.log(`📡 Пробуем ${method.toUpperCase()} запрос на ${endpoint}...`)
        console.log(`📤 Данные для отправки:`, payload)

        const resp = await api[method](endpoint, payload)
        console.log(`📥 Ответ от ${endpoint} (${method.toUpperCase()}):`, resp.status, resp.data)

        if (resp.status >= 200 && resp.status < 300) {
          console.log(`✅ Партнер успешно создан на ${endpoint} методом ${method.toUpperCase()}!`)
          return resp.data
        }
      } catch (err: any) {
        const status = err?.response?.status
        const errorData = err?.response?.data

        console.warn(`❌ Ошибка ${method.toUpperCase()} на ${endpoint}:`, status)
        console.warn(`📄 Данные ошибки:`, errorData)

        // Продолжаем пробовать другие методы/эндпоинты для 404 и 405 ошибок
        if (status === 404 || status === 405) {
          if (method === 'post') {
            console.log(`🔄 Метод POST не сработал, пробуем PUT на ${endpoint}...`)
            continue // пробуем следующий метод
          } else {
            console.log(`🔄 Эндпоинт ${endpoint} не поддерживает ни POST ни PUT, пробуем следующий эндпоинт...`)
            break // переходим к следующему эндпоинту
          }
        }

        // Для других ошибок (400, 422) - пробуем следующий метод/эндпоинт
        if (status === 400 || status === 422) {
          if (method === 'post') {
            console.log(`🔄 POST вернул ${status}, пробуем PUT на ${endpoint}...`)
            continue
          } else {
            console.log(`🔄 PUT тоже вернул ${status}, пробуем следующий эндпоинт...`)
            break
          }
        }

        // Критические ошибки - прекращаем
        if (status === 401) {
          throw new Error('Необходима авторизация для создания партнера')
        }
        if (status === 403) {
          throw new Error('Недостаточно прав для создания партнера')
        }
        if (status === 429) {
          console.error('🚫 API временно недоступен (слишком много запросов). Попробуйте через минуту.')
          throw new Error('API временно недоступен из-за слишком частых запросов. Попробуйте позже.')
        }

        // Для других ошибок - продолжаем с следующим методом
        console.log(`🔄 Продолжаем с следующим методом после ошибки ${status}...`)
        continue
      }
    }

    // Небольшая задержка между эндпоинтами
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Если ни один эндпоинт не сработал, попробуем прямой запрос к API
  console.log('🔄 Все локальные эндпоинты не сработали, пробуем прямые запросы к API...')

  try {
    console.log('🌐 Пробуем прямой POST на https://api.yessgo.org/api/v1/admin/partners')
    const directResponse = await fetch('https://api.yessgo.org/api/v1/admin/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify(payload)
    })

    console.log(`📥 Прямой ответ: ${directResponse.status}`)

    if (directResponse.ok) {
      const data = await directResponse.json()
      console.log('✅ Прямой запрос к API удался!')
      return data
    } else {
      const errorText = await directResponse.text()
      console.error('❌ Прямой запрос тоже не удался:', directResponse.status, errorText)
    }
  } catch (directErr) {
    console.error('❌ Ошибка при прямом запросе к API:', directErr)
  }

  console.error('❌ Все эндпоинты для создания партнера вернули ошибки, включая прямые запросы')
  throw new Error('Не удалось создать партнера. Проверьте подключение к API и доступные эндпоинты.')
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
  const key = String(partnerId)
  const cached = partnerProductsCache[key]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Используем кэшированные товары партнёра (memory):', partnerId)
    return cached.data
  }
  // Try persistent storage for partner products
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}partnerProducts-${key}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log('📦 Используем кэшированные товары партнёра (localStorage):', partnerId)
        partnerProductsCache[key] = { data: parsed.data, timestamp: parsed.timestamp }
        return parsed.data
      } else {
        localStorage.removeItem(`${STORAGE_PREFIX}partnerProducts-${key}`)
      }
    }
  } catch (e) {
    console.warn('⚠️ Ошибка чтения кэша товаров партнёра из localStorage', e)
  }

  try {
    const resp = await api.get(API_ENDPOINTS.partners.products.list(partnerId))
    const data = resp.data
    // Кэшируем, если получили данные
    if (data) {
      partnerProductsCache[key] = { data, timestamp: Date.now() }
      try {
        localStorage.setItem(`${STORAGE_PREFIX}partnerProducts-${key}`, JSON.stringify({ data, timestamp: Date.now() }))
      } catch (e) {
        console.warn('⚠️ Не удалось записать кэш товаров партнёра в localStorage', e)
      }
    }
    return data
  } catch (err: any) {
    // При ошибке возвращаем пустой массив (без броска), чтобы UI не падал
    console.warn(`⚠️ Ошибка загрузки товаров партнёра ${partnerId}:`, err?.response?.status || err.message)
    return []
  }
}

export function clearPartnerProductsCache(partnerId?: string | number) {
  if (partnerId === undefined) {
    Object.keys(partnerProductsCache).forEach(k => delete partnerProductsCache[k])
    console.log('🗑️ Очищен кэш товаров всех партнёров')
  } else {
    const key = String(partnerId)
    delete partnerProductsCache[key]
    console.log('🗑️ Очищен кэш товаров партнёра:', partnerId)
  }
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
