import React, { useState } from 'react'
import { createPartnerCredentials } from '../api/client'

export default function PartnerCredentialsModal({ partnerId, partnerName, onClose, onCreated }: {
  partnerId: string | number
  partnerName?: string
  onClose: () => void
  onCreated?: (data: any) => void
}) {
  const [username, setUsername] = useState('')
  const [type, setType] = useState<'temporary_password'|'one_time_token'>('temporary_password')
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setError(null)
    setLoading(true)
    try {
      const payload = { username: username || undefined, type, sendEmail }
      const res = await createPartnerCredentials(partnerId, payload)
      setResult(res)
      onCreated?.(res)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Ошибка создания учётных данных')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.5)', zIndex: 120
    }}>
      <div style={{ width: 560, background: 'var(--white)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ marginBottom: 8 }}>{partnerName ? `Учётные данные для ${partnerName}` : 'Создать учётные данные'}</h3>
        <div style={{ marginBottom: 12 }}>
          <label className="muted">Username (опционально)</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="login@example.com" style={{ width: '100%', marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="muted">Тип</label>
          <div style={{ marginTop: 6 }}>
            <label style={{ marginRight: 12 }}><input type="radio" name="type" checked={type==='temporary_password'} onChange={() => setType('temporary_password')} /> Временный пароль</label>
            <label><input type="radio" name="type" checked={type==='one_time_token'} onChange={() => setType('one_time_token')} /> Ссылка входа (one-time)</label>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
            <span className="muted">Отправить учётные данные по e-mail партнёру</span>
          </label>
        </div>
        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
        {result && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Результат</div>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="button" onClick={handleCreate} disabled={loading}>{loading ? 'Создаём...' : 'Создать'}</button>
          <button style={{ padding: '10px 14px', borderRadius: 8 }} onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}


