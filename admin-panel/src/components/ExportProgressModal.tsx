import React, { useState, useEffect } from 'react'

interface ExportProgressModalProps {
  isOpen: boolean
  onClose: () => void
  data: any[]
  onComplete: (data: any[]) => void
}

export default function ExportProgressModal({ isOpen, onClose, data, onComplete }: ExportProgressModalProps) {
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (isOpen && data.length > 0) {
      setProgress(0)
      setCurrent(0)

      // Simulate progress
      const interval = setInterval(() => {
        setCurrent(prev => {
          const next = prev + Math.floor(data.length / 10) // 10 chunks
          if (next >= data.length) {
            clearInterval(interval)
            setProgress(100)
            setTimeout(() => onComplete(data), 500)
            return data.length
          }
          setProgress((next / data.length) * 100)
          return next
        })
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isOpen, data, onComplete])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2,6,23,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="card" style={{ width: 400, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: 20 }}>
          Экспорт транзакций
        </h3>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>
            Обработка {current} из {data.length} записей...
          </div>

          <div style={{
            width: '100%',
            height: 8,
            background: 'var(--gray-200)',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
            {Math.round(progress)}% завершено
          </div>
        </div>

        {progress < 100 && (
          <button
            className="button"
            onClick={onClose}
            style={{ background: 'var(--gray-300)', color: 'var(--gray-700)' }}
          >
            Отмена
          </button>
        )}

        {progress === 100 && (
          <div style={{ color: 'var(--green-600)', fontSize: 14 }}>
            ✅ Экспорт готов к скачиванию
          </div>
        )}
      </div>
    </div>
  )
}

