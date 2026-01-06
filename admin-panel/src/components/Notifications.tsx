import React from 'react'
import { useNotification } from '../contexts/NotificationContext'

export default function Notifications() {
  const { toasts, dismissToast } = useNotification()
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => dismissToast(t.id)} style={{
          margin: '8px auto',
          maxWidth: 720,
          padding: '12px 16px',
          borderRadius: 6,
          background: t.type === 'error' ? '#f87171' : t.type === 'success' ? '#34d399' : '#1e293b',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,.25)'
        }}>
          <strong>{t.title || (t.type === 'error' ? 'Error' : t.type === 'success' ? 'Success' : 'Notice')}</strong>
          {t.message ? ` — ${t.message}` : ''}
        </div>
      ))}
    </div>
  )
}


