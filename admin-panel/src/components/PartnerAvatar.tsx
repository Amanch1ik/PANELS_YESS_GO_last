import React, { useState, useMemo } from 'react'
import { resolveAssetUrl, imageResource } from '../utils/assets'
import { normalizePartner } from '../services/normalize'

type Props = {
  partner: any
  size?: number // outer box size (default 80)
  innerCircle?: number // inner circle diameter (default 56)
  rounded?: boolean // outer box rounded (default true)
}

export default function PartnerAvatar ({ partner, size = 80, innerCircle = 56, rounded = true }: Props) {
  const [loaded, setLoaded] = useState<boolean | null>(null)

  const normalized = useMemo(() => {
    try {
      return normalizePartner(partner || {})
    } catch {
      return partner || {}
    }
  }, [partner])

  // Try many possible fields where a partner logo might be stored
  const logoUrlRaw =
    (normalized as any).logoUrl ||
    (normalized as any).imageUrl ||
    (partner && (
      partner.logoUrl ||
      partner.ImageUrl ||
      partner.Image ||
      partner.logo ||
      // nested shapes
      (partner.logo && partner.logo.url) ||
      (partner.image && partner.image.url) ||
      (Array.isArray(partner.images) && partner.images[0] && (partner.images[0].url || partner.images[0].path)) ||
      (Array.isArray(partner.image) && partner.image[0] && (partner.image[0].url || partner.image[0].path))
    ))
  let logoUrl = resolveAssetUrl(typeof logoUrlRaw === 'string' ? logoUrlRaw : '') || undefined
  // Fallback: if resolveAssetUrl couldn't resolve a relative path, try window.location.origin + raw path
  if (!logoUrl && typeof logoUrlRaw === 'string' && logoUrlRaw.trim().startsWith('/')) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      if (origin) {
        logoUrl = `${origin}${logoUrlRaw.trim()}`
      }
    } catch (e) {
      // ignore
    }
  }

  const outerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: rounded ? Math.round(size * 0.2) : 8,
    background: 'var(--white)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  }

  const circleStyle: React.CSSProperties = {
    width: `${innerCircle}px`,
    height: `${innerCircle}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gradient-primary)'
  }

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: loaded === true ? 'block' : 'none'
  }

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: loaded === true ? 'none' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--white)',
    fontSize: Math.max(14, Math.round(innerCircle / 2.5)),
    fontWeight: 700,
    background: 'var(--gradient-primary)'
  }

  const firstLetter = (partner && (partner.name || partner.Name)) ? String((partner.name || partner.Name)[0]).toUpperCase() : 'P'

  return (
    <div style={outerStyle} className="partner-avatar-wrapper">
      <div style={circleStyle} className="partner-avatar-circle">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={partner?.name || partner?.Name || 'partner'}
            loading="lazy"
            decoding="async"
            style={imgStyle}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
          />
        ) : null}

        <div style={placeholderStyle} className="partner-logo-placeholder">
          {firstLetter}
        </div>
      </div>
    </div>
  )
}


