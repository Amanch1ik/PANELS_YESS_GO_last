import React, { useEffect, useState } from 'react'
import { fetchTransactions, getTransaction } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'

type Transaction = {
  id: string | number
  created_at?: string
  user?: any
  type?: string
  amount?: number
  currency?: string
  status?: string
  reference?: string
  [key: string]: any
}

export default function Transactions({ onError }: { onError?: (msg: string) => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [total, setTotal] = useState<number | null>(null)
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, limit }
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      const resp: any = await fetchTransactions(params)
      // normalize
      const items = Array.isArray(resp) ? resp : (resp.items || resp.data || [])
      const totalCount = resp.total || resp.count || null
      setTransactions(items)
      setTotal(totalCount)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Ошибка загрузки транзакций'
      setError(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, limit, fromDate, toDate, typeFilter, statusFilter])

  const openDetails = async (t: Transaction) => {
    try {
      const data = await getTransaction(t.id)
      setSelected(data)
    } catch (err: any) {
      onError?.(err?.message || 'Ошибка загрузки транзакции')
    }
  }

  const closeDetails = () => setSelected(null)

  const exportCsv = () => {
    const rows = transactions.map(t => ({
      id: t.id,
      date: t.created_at,
      user: t.user?.name || t.user?.email || t.user || '',
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      reference: t.reference
    }))
    const keys = Object.keys(rows[0] || {})
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: '24px' }}>Транзакции</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button" onClick={exportCsv}>Экспорт CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input type="date" value={fromDate || ''} onChange={e => setFromDate(e.target.value || null)} />
        <span>—</span>
        <input type="date" value={toDate || ''} onChange={e => setToDate(e.target.value || null)} />
        <select value={typeFilter || ''} onChange={e => setTypeFilter(e.target.value || '' || null)}>
          <option value="">Все типы</option>
          <option value="deposit">Пополнение</option>
          <option value="withdraw">Снятие</option>
          <option value="order">Оплата заказа</option>
        </select>
        <select value={statusFilter || ''} onChange={e => setStatusFilter(e.target.value || '' || null)}>
          <option value="">Все статусы</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="card">
        {loading && <div className="muted">Загрузка...</div>}
        {error && <div style={{ color: '#ef4444' }}>{error}</div>}
        {!loading && transactions.length === 0 && <div className="muted">Нет транзакций</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Дата</th>
              <th style={{ padding: 8 }}>Пользователь</th>
              <th style={{ padding: 8 }}>Тип</th>
              <th style={{ padding: 8 }}>Сумма</th>
              <th style={{ padding: 8 }}>Статус</th>
              <th style={{ padding: 8 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={String(t.id)} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: 8 }}>{t.id}</td>
                <td style={{ padding: 8 }}>{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</td>
                <td style={{ padding: 8 }}>{t.user?.name || t.user?.email || t.user || ''}</td>
                <td style={{ padding: 8 }}>{t.type}</td>
                <td style={{ padding: 8 }}>{t.amount} {t.currency}</td>
                <td style={{ padding: 8 }}>{t.status}</td>
                <td style={{ padding: 8 }}>
                  <button className="button" onClick={() => openDetails(t)}>Просмотр</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>
            Страница {page}{total ? ` из ${Math.ceil(total / limit)}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button" onClick={() => setPage(p => Math.max(1, p - 1))}>Назад</button>
            <button className="button" onClick={() => setPage(p => p + 1)}>Вперёд</button>
          </div>
        </div>
      </div>

      {selected && (
        <ConfirmDialog
          title={`Транзакция ${selected.id}`}
          message={<pre style={{ maxHeight: 400, overflow: 'auto' }}>{JSON.stringify(selected, null, 2)}</pre>}
          onCancel={closeDetails}
          onConfirm={() => closeDetails()}
        />
      )}
    </div>
  )
}


