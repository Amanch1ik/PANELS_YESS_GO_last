import React from 'react'
import { useNotification } from '../contexts/NotificationContext'

export default function Notifications() {
  const { toasts, dismissToast } = useNotification()

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-atomic="true"
          style={{
            marginBottom: 12,
            maxWidth: 380,
            padding: '12px 14px',
            borderRadius: 8,
            background: t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#059669' : '#0f172a',
            color: '#fff',
            cursor: 'default',
            boxShadow: '0 6px 18px rgba(2,6,23,0.2)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}
          onMouseEnter={() => { /* allow manual dismissal - timer handled in context */ }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: t.message ? 6 : 0 }}>
              {t.title || (t.type === 'error' ? 'Ошибка' : t.type === 'success' ? 'Успех' : 'Уведомление')}
            </div>
            {t.message && <div style={{ fontSize: 13, opacity: 0.95 }}>{t.message}</div>}
          </div>
          <button
            aria-label="Закрыть уведомление"
            onClick={() => dismissToast(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: '1',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}


