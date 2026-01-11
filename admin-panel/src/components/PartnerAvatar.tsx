import React, { useState, useMemo, useEffect, useRef } from 'react'
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
    boxShadow: 'none',
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
    display: loaded === true ? 'block' : 'none',
    transform: 'scale(1.12)',
    transition: 'transform 180ms ease'
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
    background: 'var(--gradient-primary)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }

  const firstLetter = (partner && (partner.name || partner.Name)) ? String((partner.name || partner.Name)[0]).toUpperCase() : 'P'
  const [placeholderSrc, setPlaceholderSrc] = useState<string | null>(null)

  useEffect(() => {
    // Try to load a pre-generated placeholder (same-origin only)
    if (!logoUrl) {
      setPlaceholderSrc(null)
      return
    }
    try {
      const isSameOrigin = logoUrl.startsWith('/') || (typeof window !== 'undefined' && logoUrl.startsWith(window.location.origin))
      if (!isSameOrigin) {
        setPlaceholderSrc(null)
        return
      }
      const placeholderCandidate = logoUrl.replace(/\.(jpe?g|png)$/i, '.placeholder.webp')
      const img = new Image()
      img.src = placeholderCandidate
      img.onload = () => setPlaceholderSrc(placeholderCandidate)
      img.onerror = () => setPlaceholderSrc(null)
    } catch (e) {
      setPlaceholderSrc(null)
    }
  }, [logoUrl])

  // set fetchpriority attribute on the img element (avoid TypeScript/React prop typing issues)
  const imgRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    try {
      if (imgRef.current && logoUrl) {
        imgRef.current.setAttribute('fetchpriority', 'high')
      }
    } catch (e) {
      // ignore
    }
  }, [logoUrl])

  return (
    <div style={outerStyle} className="partner-avatar-wrapper">
      <div
        style={{
          ...circleStyle,
          // if placeholder available, show it as background while real image loads
          backgroundImage: placeholderSrc ? `url(${placeholderSrc})` : undefined
        }}
        className="partner-avatar-circle"
      >
        {logoUrl ? (
          <picture>
            {/* Prefer local/webp variant when available */}
            { (logoUrl.endsWith('.png') || logoUrl.endsWith('.jpg') || logoUrl.endsWith('.jpeg')) && (logoUrl.startsWith('/') || (typeof window !== 'undefined' && logoUrl.startsWith(window.location.origin))) ? (
              <source srcSet={logoUrl.replace(/\.(jpe?g|png)$/i, '.webp')} type="image/webp" />
            ) : null }
            <img
              src={logoUrl}
              alt={partner?.name || partner?.Name || 'partner'}
              loading="eager"
              decoding="async"
              width={innerCircle}
              height={innerCircle}
              style={imgStyle}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(false)}
              ref={imgRef}
            />
          </picture>
        ) : null}

        {/* Placeholder: either blurred image or letter */}
        {!placeholderSrc ? (
          <div style={placeholderStyle} className="partner-logo-placeholder">
            {firstLetter}
          </div>
        ) : null}
      </div>
    </div>
  )
}


