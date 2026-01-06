import React from 'react'

export default function ConfirmDialog({ title, message, onCancel, onConfirm }: {
  title?: string
  message?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80
    }}>
      <div className="card" style={{ width: 420 }}>
        <h3 style={{ color: 'var(--gray-900)', textShadow: 'none' }}>{title || 'Подтверждение'}</h3>
        <div className="muted" style={{ marginBottom: 12, textShadow: 'none' }}>{message || 'Вы уверены?'}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="button" onClick={onCancel} style={{ background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }}>Отмена</button>
          <button className="button" onClick={onConfirm}>Подтвердить</button>
        </div>
      </div>
    </div>
  )
}


