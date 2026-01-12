// Admin panel API config — inspired by web-version implementation
// Priority:
// - In dev we prefer to use Vite proxy '/api' so frontend works without local backend clone
// - Otherwise, use VITE_API_BASE_URL if provided, or fallback to production API host

const rawEnvCandidate = (import.meta.env as { VITE_API_BASE_URL?: string; VITE_API_BASE?: string }).VITE_API_BASE_URL
  || (import.meta.env as { VITE_API_BASE?: string }).VITE_API_BASE
  || 'https://api.yessgo.org'

// Defensive sanitization: sometimes .env may be malformed (entries concatenated without newlines)
// e.g. "https://api.yessgo.org/api/v1VITE_API_PROXY_TARGET=..."
// Strip anything starting with another VITE_ token or any accidental concatenated env entry.
let baseCandidate = String(rawEnvCandidate).trim()
const viteIdx = baseCandidate.search(/\bVITE_/i)
if (viteIdx > 0) {
  baseCandidate = baseCandidate.slice(0, viteIdx).trim()
}

// remove any accidental concatenated key=value (e.g. "... api/v1HTTP_..."), stop at first whitespace or unexpected '='
const accidentalIdx = baseCandidate.search(/[\s=]/)
if (accidentalIdx > 0) {
  baseCandidate = baseCandidate.slice(0, accidentalIdx).trim()
}

// remove leading dots if someone wrote ".api.yessgo.org"
baseCandidate = baseCandidate.replace(/^\.+/, '')

// ensure protocol (default to https)
if (!/^https?:\/\//i.test(baseCandidate)) {
  // avoid cases like "api.yessgo.org" -> prepend https://
  baseCandidate = `https://${baseCandidate.replace(/^\/+/, '')}`
}

// Remove trailing docs/index.html, /docs, /api, /api/v1, /v1 to normalize
const normalizedBase = baseCandidate.replace(/(\/docs(\/index\.html)?)|(\/api(\/v1)?)|(\/v1)\/?$/i, '')

export const API_BASE_URL = (import.meta.env as { DEV?: boolean }).DEV ? '/api' : normalizedBase
export const API_VERSION = '/v1'

