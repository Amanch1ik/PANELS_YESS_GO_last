import React, { useEffect, useRef, useState } from 'react'
import SkeletonGrid from '../components/Skeleton'
import PartnerAvatar from '../components/PartnerAvatar'
import { fetchPartners } from '../api/client'

type Partner = {
  id: number | string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  two_gis_url?: string
  location?: any
}

function extractCoords(p: any): { lat?: number, lng?: number } {
  if (!p) return {}
  if (typeof p.latitude === 'number' && typeof p.longitude === 'number') return { lat: p.latitude, lng: p.longitude }
  if (typeof p.lat === 'number' && typeof p.lng === 'number') return { lat: p.lat, lng: p.lng }
  if (typeof p.latitude === 'string' && typeof p.longitude === 'string') {
    const lat = parseFloat(p.latitude)
    const lng = parseFloat(p.longitude)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
  }
  if (p.location && typeof p.location === 'object') {
    const loc = p.location
    const latVal = loc.lat || loc.latitude
    const lngVal = loc.lng || loc.longitude
    if (latVal && lngVal) {
      const lat = parseFloat(String(latVal))
      const lng = parseFloat(String(lngVal))
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
    }
  }
  if (p.two_gis_url && typeof p.two_gis_url === 'string') {
    const m = p.two_gis_url.match(/@([0-9.+-]+),([0-9.+-]+)/)
    if (m) {
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
    }
  }
  return {}
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).__dg_loader_loaded) return resolve()
    if (document.querySelector(`script[data-src="${src}"]`)) {
      (window as any).__dg_loader_loaded = true
      return resolve()
    }
    const s = document.createElement('script')
    s.setAttribute('data-src', src)
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = (e) => reject(e)
    document.head.appendChild(s)
  })
}

export default function Map({ onError }: { onError?: (msg: string) => void }) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markersMapRef = useRef<any>(new (globalThis as any).Map())
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
  const [loadTriggered, setLoadTriggered] = useState(false)
  const initRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchPartners()
        const list = Array.isArray(data) ? data : (data.items || data.data || [])
        if (!mounted) return
        setPartners(list)
      } catch (err: any) {
        const msg = err?.message || 'Ошибка загрузки партнёров'
        setError(msg)
        if (onError) onError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // Initialize 2GIS map once partners loaded and when DOM available
    const init = async () => {
      if (!containerRef.current) return
      // load 2gis loader
      try {
        await loadScript('https://maps.api.2gis.ru/2.0/loader.js?pkg=full')
        ;(window as any).__dg_loader_loaded = true
      } catch (e) {
        console.error('Не удалось загрузить 2GIS SDK', e)
        return
      }

      // Wait for DG global to appear (loader may initialize asynchronously).
      const waitForDG = async (timeout = 15000, interval = 250) => {
        let waited = 0
        while (waited < timeout) {
          const DGc = (window as any).DG
          if (DGc) return DGc
          // small sleep
          // eslint-disable-next-line no-await-in-loop
          await new Promise(res => setTimeout(res, interval))
          waited += interval
        }
        return null
      }

      let DG = await waitForDG(15000)
      if (!DG) {
        // Try several retries with cache-bust in case loader was cached/failed to init
        for (let attempt = 1; attempt <= 4 && !DG; attempt++) {
          try {
            const src = `https://maps.api.2gis.ru/2.0/loader.js?pkg=full&_cb=${Date.now()}`
            console.log(`[Map] retrying loader (attempt ${attempt}) src=${src}`)
            await loadScript(src)
            // eslint-disable-next-line no-await-in-loop
            DG = await waitForDG(5000)
          } catch (err) {
            console.warn('[Map] loader retry failed', err)
          }
        }
      }

      if (!DG) {
        // If DG appeared very shortly after waitForDG returned, prefer the global value
        DG = (window as any).DG
      }
      if (!DG) {
        console.error('2GIS SDK не найден после загрузки — попробуйте проверить доступ к https://maps.api.2gis.ru/loader.js и наличие API-ключа. window.DG=', (window as any).DG)
        return
      }

      const initMapWithDG = (dgParam?: any) => {
        const DGLocal = dgParam || (window as any).DG
        // compute center from available coords or fallback
        const coordsList = partners.map(p => extractCoords(p)).filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')
        const center = coordsList.length > 0
          ? [coordsList[0].lat as number, coordsList[0].lng as number]
          : [42.8746, 74.6122] // Bishkek fallback

        try {
          // cleanup previous map if exists
          if (mapRef.current && typeof mapRef.current.remove === 'function') {
            try { mapRef.current.remove() } catch {}
            mapRef.current = null
          }

          const map = (DGLocal as any).map(containerRef.current, {
            center,
            zoom: 10,
          })
          mapRef.current = map

          // add markers and store them for later focus
          markersMapRef.current.clear()
          for (const p of partners) {
            const c = extractCoords(p)
            if (typeof c.lat === 'number' && typeof c.lng === 'number') {
              const marker = (DGLocal as any).marker([c.lat, c.lng]).addTo(map)
              const popupHtml = `<div style="min-width:160px"><strong>${String(p.name)}</strong><div style="margin-top:6px;font-size:13px;color:#444">${p.address ? String(p.address) : ''}</div><div style="margin-top:8px"><a href="${p.two_gis_url || (`https://2gis.ru/search/${encodeURIComponent(String(p.name))}`)}" target="_blank" rel="noreferrer">Открыть в 2ГИС</a></div></div>`
              marker.bindPopup(popupHtml)
              try {
                markersMapRef.current.set(String(p.id), marker)
              } catch (_) {}
            }
          }
        } catch (err) {
          console.error('Ошибка инициализации карты 2GIS', err)
        }
      }

      // DG can be a Promise-like loader (DG.then) — wait if necessary
      try {
        if (typeof DG.then === 'function') {
          // prefer resolved instance passed to then callback if provided
          DG.then((resolved: any) => {
            try { initMapWithDG(resolved || (window as any).DG) } catch (err) { console.error('Ошибка при инициализации через DG.then', err) }
          })
        } else if (typeof (window as any).DG?.map === 'function' || typeof DG.map === 'function') {
          initMapWithDG(DG)
        } else {
          // fallback: try to initialize using global DG after short delay
          setTimeout(() => {
            try { initMapWithDG((window as any).DG) } catch (err) { console.error('Ошибка при отложенной инициализации 2GIS', err) }
          }, 200)
        }
      } catch (err) {
        console.error('Ошибка инициализации карты 2GIS (outer)', err)
      }
    }

    // expose init via ref so UI/button or observer can trigger it
    initRef.current = init

    // If already triggered (e.g., user clicked), run immediately
    if (loadTriggered) {
      const id = (window as any).requestIdleCallback ? (window as any).requestIdleCallback(init) : setTimeout(init, 200)
      return () => {
        if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(id)
        else clearTimeout(id)
      }
    }

    // Use IntersectionObserver to lazily load the SDK when map comes into view
    let observer: IntersectionObserver | null = null
    try {
      if (containerRef.current && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setLoadTriggered(true)
              initRef.current && initRef.current()
              observer && observer.disconnect()
            }
          }
        }, { root: null, threshold: 0.1 })
        observer.observe(containerRef.current)
      } else {
        // no observer support — init after short idle
        const id = (window as any).requestIdleCallback ? (window as any).requestIdleCallback(init) : setTimeout(init, 200)
        return () => {
          if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(id)
          else clearTimeout(id)
        }
      }
    } catch (err) {
      // fallback
      const id = (window as any).requestIdleCallback ? (window as any).requestIdleCallback(init) : setTimeout(init, 200)
      return () => {
        if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(id)
        else clearTimeout(id)
      }
    }

    return () => {
      if (observer) observer.disconnect()
      if (mapRef.current && typeof mapRef.current.remove === 'function') {
        try { mapRef.current.remove() } catch {}
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partners, containerRef.current])

  return (
    <div className="container">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Карта партнёров (2ГИС)</h2>
        <div style={{ color: 'var(--gray-600)' }}>Маршруты и метки — через 2ГИС SDK</div>
      </div>

      {loading && <SkeletonGrid count={3} columns={1} itemHeight={80} />}

      {error && (
        <div style={{ padding: 12, background: 'rgba(255,230,230,0.6)', borderRadius: 8 }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minHeight: 400, position: 'relative' }}>
          <div ref={containerRef} id="dg-map" style={{ width: '100%', height: 480, borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }} />
        </div>
        <div style={{ width: 360 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Список партнёров</div>
          {partners.length === 0 && !loading && <div style={{ color: 'var(--gray-600)' }}>Партнёров нет</div>}
          <div style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {partners.map(p => {
              const c = extractCoords(p)
              const hasCoords = typeof c.lat === 'number' && typeof c.lng === 'number'
              const id = String(p.id)
              return (
                <div key={id} style={{ display: 'flex' }}>
                  <button
                    role="button"
                    onClick={() => {
                      // focus marker if available
                      const map = mapRef.current
                      const marker = markersMapRef.current.get(id)
                      if (marker && map && typeof map.setView === 'function') {
                        try {
                          map.setView([c.lat, c.lng], 14)
                          marker.openPopup && marker.openPopup()
                          setActivePartnerId(id)
                        } catch (err) {
                          // ignore
                        }
                      } else {
                        setActivePartnerId(id)
                      }
                    }}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: activePartnerId === id ? '1px solid rgba(7,185,129,0.18)' : '1px solid var(--gray-200)',
                      background: activePartnerId === id ? 'linear-gradient(180deg, rgba(7,185,129,0.04), rgba(7,185,129,0.01))' : 'var(--white)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      boxShadow: activePartnerId === id ? '0 8px 20px rgba(7,185,129,0.06)' : 'none'
                    }}
                  >
                    <div style={{ width: 56, height: 56, flexShrink: 0 }}>
                      <PartnerAvatar partner={p} size={56} innerCircle={44} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hasCoords ? `${c.lat!.toFixed(6)}, ${c.lng!.toFixed(6)}` : (p.address || 'Адрес не указан')}</div>
                    </div>
                    <div style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>Открыть</div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

