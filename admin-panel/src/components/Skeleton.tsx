import React from 'react'

type SkeletonBlockProps = {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonBlockProps) {
  const blockStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    background: 'linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 37%, rgba(0,0,0,0.06) 63%)',
    backgroundSize: '400% 100%',
    animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
    ...style
  }

  return (
    <>
      <div style={blockStyle} aria-hidden />
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}

type SkeletonGridProps = {
  count?: number
  columns?: number
  gap?: number
  itemHeight?: number
}

export default function SkeletonGrid({ count = 6, columns = 3, gap = 12, itemHeight = 80 }: SkeletonGridProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  }

  return (
    <div style={gridStyle} role="status" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: 12, background: 'var(--white)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <SkeletonBlock height={18} width="60%" style={{ marginBottom: 10 }} />
          <SkeletonBlock height={12} width="80%" style={{ marginBottom: 8 }} />
          <SkeletonBlock height={12} width="40%" />
        </div>
      ))}
    </div>
  )
}

