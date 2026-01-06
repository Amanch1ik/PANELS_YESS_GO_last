import React, { useEffect, useState } from 'react'
import { fetchMessages } from '../api/client'

type Message = {
  id: string | number
  subject?: string
  text?: string
  createdAt?: string
}

export default function Messages({ onError }: { onError?: (msg: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchMessages()
      .then(data => {
        if (!mounted) return
        setMessages(Array.isArray(data) ? data : data.items || data.data || [])
      })
      .catch(err => {
        const msg = err?.response?.data?.message || err.message || 'Ошибка загрузки сообщений'
        setError(msg)
        onError?.(msg)
      })
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className="container">
      <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: '24px' }}>Сообщения</h2>
      <div className="card">
        {loading && <div className="muted" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Загрузка...</div>}
        {error && <div style={{ color: '#ff7b7b', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{error}</div>}
        {!loading && messages.length === 0 && <div className="muted" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Нет сообщений</div>}
        <ul>
          {messages.map(m => (
            <li key={String(m.id)} style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <strong style={{ color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{m.subject || 'Без темы'}</strong>
              <div className="muted" style={{ fontSize: 13, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{m.text}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}


