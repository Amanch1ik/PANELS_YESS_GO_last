import React from 'react'

type LogEntry = { id: string; timestamp: string; user: string; action: string; details?: string }

const sampleLogs: LogEntry[] = [
  { id: '1', timestamp: '2026-01-01 12:00', user: 'admin', action: 'ВХОД', details: 'Успешный вход в систему' },
  { id: '2', timestamp: '2026-01-01 12:05', user: 'admin', action: 'ОБНОВЛЕНИЕ', details: 'Обновлен партнер "Acme" (id=123)' },
  { id: '3', timestamp: '2026-01-01 12:10', user: 'editor', action: 'СОЗДАНИЕ', details: 'Создан продукт "Widget"' },
]

export default function AuditLogs() {
  return (
    <div className="container">
      <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: '24px' }}>Аудит логов (Демо)</h2>
      <div className="card">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sampleLogs.map(l => (
            <li key={l.id} style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{l.timestamp}</strong>
                <span className="muted" style={{ fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{l.user} - {l.action}</span>
              </div>
              {l.details && <div className="muted" style={{ fontSize: 13, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{l.details}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}


