import React from 'react'
import { useNotification } from '../contexts/NotificationContext'

export default function Notifications() {
  const { toasts, dismissToast } = useNotification()

  return (
    <div style={{ 
      position: 'fixed', 
      top: 16, 
      right: 16, 
      zIndex: 9999, 
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 'calc(100vw - 32px)'
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-atomic="true"
          aria-live={t.type === 'error' ? 'assertive' : 'polite'}
          style={{
            marginBottom: 0,
            maxWidth: 380,
            minWidth: 300,
            padding: '14px 16px',
            borderRadius: 12,
            background: t.type === 'error' 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : t.type === 'success' 
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            cursor: 'default',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ 
            fontSize: 20, 
            lineHeight: 1,
            marginTop: 2,
            flexShrink: 0
          }}>
            {t.type === 'error' ? '⚠️' : t.type === 'success' ? '✅' : 'ℹ️'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 700, 
              marginBottom: t.message ? 6 : 0,
              fontSize: 15,
              lineHeight: 1.3
            }}>
              {t.title || (t.type === 'error' ? 'Ошибка' : t.type === 'success' ? 'Успех' : 'Уведомление')}
            </div>
            {t.message && (
              <div style={{ 
                fontSize: 13, 
                opacity: 0.95,
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {t.message}
              </div>
            )}
          </div>
          <button
            aria-label="Закрыть уведомление"
            onClick={() => dismissToast(t.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'rgba(255,255,255,0.95)',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: '1',
              padding: '4px 6px',
              borderRadius: 6,
              transition: 'all 0.2s ease',
              flexShrink: 0,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 480px) {
          div[role="status"] {
            min-width: auto !important;
            max-width: calc(100vw - 32px) !important;
          }
        }
      `}</style>
    </div>
  )
}


