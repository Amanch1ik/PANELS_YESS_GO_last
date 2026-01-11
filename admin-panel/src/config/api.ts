// Admin panel API config — inspired by web-version implementation
// Priority:
// - In dev we prefer to use Vite proxy '/api' so frontend works without local backend clone
// - Otherwise, use VITE_API_BASE_URL if provided, or fallback to production API host

const rawBase = (import.meta.env as { VITE_API_BASE_URL?: string; VITE_API_BASE?: string }).VITE_API_BASE_URL
  || (import.meta.env as { VITE_API_BASE?: string }).VITE_API_BASE
  || 'https://api.yessgo.org'

// Remove trailing docs/index.html, /docs, /api, /api/v1, /v1 to normalize
const normalizedBase = String(rawBase).replace(/(\/docs(\/index\.html)?)|(\/api(\/v1)?)|(\/v1)\/?$/i, '')

export const API_BASE_URL = (import.meta.env as { DEV?: boolean }).DEV ? '/api' : normalizedBase

export const API_VERSION = '/v1'

