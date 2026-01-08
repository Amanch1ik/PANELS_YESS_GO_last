import React, { useState, useEffect } from 'react'
import { fetchAuditLogs } from '../api/client'

type LogEntry = {
  id: string | number
  timestamp?: string
  created_at?: string
  user?: string | { name?: string; email?: string; username?: string }
  action?: string
  event?: string
  type?: string
  details?: string
  description?: string
  data?: any
  [key: string]: any
}

export default function AuditLogs({ onError }: { onError?: (msg: string) => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('📋 Загружаем логи аудита...')
      const data = await fetchAuditLogs({ limit: 100 })
      setLogs(Array.isArray(data) ? data : [])
      console.log(`✅ Загружено ${Array.isArray(data) ? data.length : 0} записей логов аудита`)
    } catch (err: any) {
      const msg = err?.message || 'Ошибка загрузки логов аудита'
      setError(msg)
      console.error('❌ Ошибка загрузки логов аудита:', err)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Система'
    if (typeof user === 'string') return user
    if (typeof user === 'object') {
      return user.name || user.email || user.username || 'Неизвестный пользователь'
    }
    return 'Неизвестный пользователь'
  }

  const getActionDisplayName = (log: LogEntry): string => {
    const action = log.action || log.event || log.type || 'ДЕЙСТВИЕ'
    return action.toUpperCase()
  }

  const formatTimestamp = (log: LogEntry): string => {
    const timestamp = log.timestamp || log.created_at
    if (!timestamp) return new Date().toLocaleString('ru-RU')

    try {
      return new Date(timestamp).toLocaleString('ru-RU')
    } catch {
      return timestamp
    }
  }

  const getDetails = (log: LogEntry): string => {
    return log.details || log.description || log.data?.message || ''
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', margin: 0 }}>Аудит логов</h2>
        <button
          onClick={loadLogs}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: loading ? 'var(--gray-400)' : 'var(--accent)',
            color: 'var(--white)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Загрузка...' : '🔄 Обновить'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: 'var(--error-bg)',
          color: 'var(--error)',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid var(--error)'
        }}>
          ❌ {error}
        </div>
      )}

      <div className="card">
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>
            🔄 Загрузка логов аудита...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>
            📋 Логи аудита отсутствуют или недоступны
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {logs.map((log, index) => (
              <li key={log.id || index} style={{
                padding: '12px 16px',
                borderBottom: index < logs.length - 1 ? '1px solid var(--gray-200)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 500,
                      color: 'var(--gray-900)',
                      marginBottom: '4px'
                    }}>
                      {formatTimestamp(log)}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--gray-600)',
                      marginBottom: '4px'
                    }}>
                      {getUserDisplayName(log.user)} • {getActionDisplayName(log)}
                    </div>
                    {getDetails(log) && (
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--gray-500)',
                        lineHeight: 1.4
                      }}>
                        {getDetails(log)}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


