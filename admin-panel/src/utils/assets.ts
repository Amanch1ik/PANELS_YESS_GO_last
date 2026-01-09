// Lightweight resolver for asset URLs (images/icons)
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://api.yessgo.org'

export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  const trimmed = String(url).trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined
  if (trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  const base = (API_BASE as string).replace(/\/$/, '')
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${base}${path}`
}

export function imageResource(filename: string): string {
  const base = (import.meta as any).env?.BASE_URL || '/'
  const cleanBase = base === './' ? '/' : base
  const cleanPath = filename.startsWith('/') ? filename.slice(1) : filename
  try {
    return encodeURI(`${cleanBase.replace(/\/$/, '')}/${cleanPath}`)
  } catch {
    return `${cleanBase.replace(/\/$/, '')}/${cleanPath}`
  }
}


