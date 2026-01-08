import React, { useState, useEffect } from 'react'
import { fetchTransactions, getUser } from '../api/client'
import TransactionDetailModal from '../components/TransactionDetailModal'

type Transaction = {
  id: string | number
  created_at?: string
  user?: any
  type?: string
  amount?: number
  currency?: string
  status?: string
  reference?: string
  method?: string
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Helper functions for user display
  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Неизвестный пользователь'

    // Handle case where user is just a string/number (user ID)
    if (typeof user === 'string' || typeof user === 'number') {
      return `Пользователь #${user}`
    }

    // Check for common user ID fields if user is an object
    if (typeof user === 'object') {
      if (user.user_id) return `Пользователь #${user.user_id}`
      if (user.userId) return `Пользователь #${user.userId}`
      if (user.customer_id) return `Клиент #${user.customer_id}`
      if (user.customerId) return `Клиент #${user.customerId}`
    }

    // Try different field combinations
    if (user.name) return user.name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    if (user.last_name) return user.last_name
    if (user.username) return user.username
    if (user.display_name) return user.display_name
    if (user.full_name) return user.full_name

    // Try to get from nested objects
    if (user.profile?.name) return user.profile.name
    if (user.profile?.first_name && user.profile?.last_name) return `${user.profile.first_name} ${user.profile.last_name}`

    // Fallback to ID or other identifiers
    if (user.id) return `Пользователь #${user.id}`

    return 'Неизвестный пользователь'
  }

  const getUserContactInfo = (user: any): string => {
    if (!user) return ''

    // Handle case where user is just a string/number (user ID)
    if (typeof user === 'string' || typeof user === 'number') {
      return `ID: ${user}`
    }

    // Check for common user ID fields if user is an object
    if (typeof user === 'object') {
      if (user.user_id) return `User ID: ${user.user_id}`
      if (user.userId) return `User ID: ${user.userId}`
      if (user.customer_id) return `Customer ID: ${user.customer_id}`
      if (user.customerId) return `Customer ID: ${user.customerId}`
    }

    // Try different contact fields
    if (user.email) return user.email
    if (user.phone) return user.phone
    if (user.phone_number) return user.phone_number
    if (user.mobile) return user.mobile

    // Try nested profile
    if (user.profile?.email) return user.profile.email
    if (user.profile?.phone) return user.profile.phone

    // Show ID if no contact info
    if (user.id) return `ID: ${user.id}`

    return ''
  }

  // Function to enrich transactions with user data
  const enrichTransactionsWithUserData = async (transactions: any[]): Promise<any[]> => {
    const userIds = new Set<string | number>()

    // Collect all unique user IDs that need enrichment
    transactions.forEach(tx => {
      if (tx.user_id && !tx.user) userIds.add(tx.user_id)
      if (tx.customer_id && !tx.user) userIds.add(tx.customer_id)
      if (typeof tx.user === 'string' || typeof tx.user === 'number') {
        userIds.add(tx.user)
      }
    })

    if (userIds.size === 0) {
      console.log('No user IDs to enrich')
      return transactions
    }

    console.log('Enriching user data for IDs:', Array.from(userIds))

    // Try to fetch user data for collected IDs
    const userDataMap = new Map<string | number, any>()
    const fetchPromises = Array.from(userIds).map(async (userId) => {
      try {
        const userData = await getUser(userId)
        userDataMap.set(userId, userData)
        console.log(`Fetched user data for ID ${userId}:`, userData)
      } catch (error) {
        console.warn(`Failed to fetch user data for ID ${userId}:`, error)
        // Create fallback user object
        userDataMap.set(userId, {
          id: userId,
          name: `Пользователь #${userId}`,
          fallback: true
        })
      }
    })

    await Promise.allSettled(fetchPromises)

    // Enrich transactions with user data
    return transactions.map(tx => {
      let userId: string | number | null = null

      if (tx.user_id) userId = tx.user_id
      else if (tx.customer_id) userId = tx.customer_id
      else if (typeof tx.user === 'string' || typeof tx.user === 'number') userId = tx.user

      if (userId && userDataMap.has(userId)) {
        return {
          ...tx,
          user: userDataMap.get(userId)
        }
      }

      return tx
    })
  }

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: Record<string, any> = { page, limit }

      // Add filters
      if (fromDate) {
        const fromDateTime = new Date(fromDate + 'T00:00:00.000Z') // Start of day in UTC
        const fromISOString = fromDateTime.toISOString()

        // Try different parameter names and formats that APIs might expect
        params.from = fromDate
        params.date_from = fromDate
        params.start_date = fromDate
        params.created_at_from = fromDate
        params.created_from = fromDate
        params.date_start = fromDate
        params.startDate = fromDate

        // Also try with timestamps
        params.from_timestamp = fromISOString
        params.start_timestamp = fromISOString
        params.created_at_gte = fromISOString
        params.date_gte = fromDate
      }
      if (toDate) {
        const toDateTime = new Date(toDate + 'T23:59:59.999Z') // End of day in UTC
        const toISOString = toDateTime.toISOString()

        // Try different parameter names and formats that APIs might expect
        params.to = toDate
        params.date_to = toDate
        params.end_date = toDate
        params.created_at_to = toDate
        params.created_to = toDate
        params.date_end = toDate
        params.endDate = toDate

        // Also try with timestamps
        params.to_timestamp = toISOString
        params.end_timestamp = toISOString
        params.created_at_lte = toISOString
        params.date_lte = toDate
      }
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter

      console.log('Loading transactions with params:', params)
      console.log('Date filters - from:', fromDate, 'to:', toDate)
      console.log('All params keys:', Object.keys(params))
      console.log('Date-related params:', Object.keys(params).filter(key => key.includes('date') || key.includes('from') || key.includes('to') || key.includes('created') || key.includes('start') || key.includes('end')))

      const response = await fetchTransactions(params)
      console.log('API Response:', response)

      // Handle different response formats
      const items = Array.isArray(response) ? response : (response?.items || response?.data || [])
      const totalCount = response?.total || response?.count || null

      console.log(`Loaded ${items.length} transactions${totalCount ? ` (total: ${totalCount})` : ''}`)

      // Try to enrich user data if only IDs are available
      const enrichedItems = await enrichTransactionsWithUserData(items)
      console.log(`Enriched ${enrichedItems.length} transactions with user data`)

      setTransactions(enrichedItems)
      setTotal(totalCount)

      if (items.length === 0) {
        setError('Нет транзакций для отображения')
      }

    } catch (err: any) {
      console.error('Error loading transactions:', err)

      const errorMessage = err?.response?.data?.message ||
                          err?.response?.data?.error ||
                          err?.message ||
                          'Ошибка загрузки транзакций'

      setError(errorMessage)
      onError?.(errorMessage)

      // Set empty array on error
      setTransactions([])
      setTotal(null)
    } finally {
      setLoading(false)
    }
  }

  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  const closeTransactionDetails = () => {
    setSelectedTransaction(null)
  }

  useEffect(() => {
    loadTransactions()
  }, [page, limit, fromDate, toDate, typeFilter, statusFilter])

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', margin: 0 }}>
          Транзакции
        </h2>
        <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
          {total ? `Всего: ${total} транзакций` : ''}
        </div>
      </div>

      {/* Current filters info */}
      {(fromDate || toDate || typeFilter || statusFilter) && (
        <div style={{ marginBottom: 16, padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--gray-700)' }}>Примененные фильтры:</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--gray-600)' }}>
            {fromDate && toDate && (
              <span>📅 Период: {new Date(fromDate).toLocaleDateString('ru-RU')} — {new Date(toDate).toLocaleDateString('ru-RU')}</span>
            )}
            {fromDate && !toDate && (
              <span>📅 С: {new Date(fromDate).toLocaleDateString('ru-RU')}</span>
            )}
            {!fromDate && toDate && (
              <span>📅 По: {new Date(toDate).toLocaleDateString('ru-RU')}</span>
            )}
            {typeFilter && (
              <span>🏷️ Тип: {typeFilter === 'deposit' ? 'Пополнение' : typeFilter === 'withdraw' ? 'Снятие' : typeFilter === 'order' ? 'Заказ' : typeFilter === 'refund' ? 'Возврат' : typeFilter}</span>
            )}
            {statusFilter && (
              <span>📊 Статус: {statusFilter === 'success' ? 'Успешно' : statusFilter === 'pending' ? 'Ожидание' : statusFilter === 'failed' ? 'Ошибка' : statusFilter === 'refunded' ? 'Возвращено' : statusFilter}</span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Период:</label>
          <select
            value=""
            onChange={(e) => {
              const value = e.target.value
              const now = new Date()
              let from: Date | null = null
              let to: Date | null = null

              switch (value) {
                case 'today':
                  from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                  to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                  break
                case 'yesterday':
                  const yesterday = new Date(now)
                  yesterday.setDate(yesterday.getDate() - 1)
                  from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
                  to = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
                  break
                case 'week':
                  from = new Date(now)
                  from.setDate(now.getDate() - 7)
                  to = now
                  break
                case 'month':
                  from = new Date(now)
                  from.setDate(now.getDate() - 30)
                  to = now
                  break
                case 'quarter':
                  from = new Date(now)
                  from.setMonth(now.getMonth() - 3)
                  to = now
                  break
                case 'year':
                  from = new Date(now)
                  from.setFullYear(now.getFullYear() - 1)
                  to = now
                  break
                case 'this_month':
                  from = new Date(now.getFullYear(), now.getMonth(), 1)
                  to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                  break
                case 'last_month':
                  from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                  to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
                  break
                case 'this_year':
                  from = new Date(now.getFullYear(), 0, 1)
                  to = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
                  break
                case 'last_year':
                  from = new Date(now.getFullYear() - 1, 0, 1)
                  to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
                  break
                default:
                  return
              }

              setFromDate(from ? from.toISOString().split('T')[0] : null)
              setToDate(to ? to.toISOString().split('T')[0] : null)
              setPage(1) // Reset to first page
            }}
            style={{ padding: '6px 8px', border: '1px solid var(--gray-300)', borderRadius: 4 }}
          >
            <option value="">Выберите период</option>
            <option value="today">Сегодня</option>
            <option value="yesterday">Вчера</option>
            <option value="week">Последние 7 дней</option>
            <option value="month">Последние 30 дней</option>
            <option value="quarter">Последние 3 месяца</option>
            <option value="year">Последний год</option>
            <option value="this_month">Этот месяц</option>
            <option value="last_month">Прошлый месяц</option>
            <option value="this_year">Этот год</option>
            <option value="last_year">Прошлый год</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>или выберите даты:</label>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => setFromDate(e.target.value || null)}
            placeholder="с"
            style={{ padding: '6px 8px', border: '1px solid var(--gray-300)', borderRadius: 4 }}
          />
          <span>—</span>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => setToDate(e.target.value || null)}
            placeholder="по"
            style={{ padding: '6px 8px', border: '1px solid var(--gray-300)', borderRadius: 4 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Тип:</label>
          <select
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            style={{ padding: '6px 8px', border: '1px solid var(--gray-300)', borderRadius: 4 }}
          >
            <option value="">Все типы</option>
            <option value="deposit">Пополнение</option>
            <option value="withdraw">Снятие</option>
            <option value="order">Заказ</option>
            <option value="refund">Возврат</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Статус:</label>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            style={{ padding: '6px 8px', border: '1px solid var(--gray-300)', borderRadius: 4 }}
          >
            <option value="">Все статусы</option>
            <option value="success">Успешно</option>
            <option value="pending">Ожидание</option>
            <option value="failed">Ошибка</option>
            <option value="refunded">Возвращено</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              setFromDate(null)
              setToDate(null)
            }}
            style={{
              padding: '6px 12px',
              background: 'var(--gray-200)',
              color: 'var(--gray-700)',
              border: '1px solid var(--gray-300)',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Очистить даты
          </button>

          <button
            onClick={() => {
              setFromDate(null)
              setToDate(null)
              setTypeFilter(null)
              setStatusFilter(null)
              setPage(1)
            }}
            style={{
              padding: '6px 12px',
              background: 'var(--gray-200)',
              color: 'var(--gray-700)',
              border: '1px solid var(--gray-300)',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Сбросить все фильтры
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="muted">Загрузка транзакций...</div>
          {(fromDate || toDate) && (
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
              Применяются фильтры дат: {fromDate && `с ${fromDate}`} {toDate && `по ${toDate}`}
            </div>
          )}
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '20px', background: '#fee', border: '1px solid #fcc' }}>
          <div style={{ color: '#c33' }}>
            <strong>Ошибка:</strong> {error}
          </div>
          <button
            onClick={loadTransactions}
            style={{ marginTop: '10px', padding: '6px 12px', background: '#c33', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Попробовать снова
          </button>
        </div>
      ) : (
        <div className="card">
          {transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
              Нет транзакций для отображения
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>ID</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Дата</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Пользователь</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Тип</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Сумма</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Статус</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Метод</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Reference</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--gray-700)' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: Transaction) => (
                    <tr key={String(t.id)} style={{ borderBottom: '1px solid var(--gray-100)', ':hover': { background: 'var(--gray-50)' } }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '14px' }}>
                        {t.id}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleString('ru-RU') : '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 500 }}>
                          {getUserDisplayName(t.user)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                          {getUserContactInfo(t.user)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: t.type === 'deposit' ? '#d1fae5' : t.type === 'withdraw' ? '#fee2e2' : '#e0f2fe',
                          color: t.type === 'deposit' ? '#065f46' : t.type === 'withdraw' ? '#991b1b' : '#0c4a6e'
                        }}>
                          {t.type === 'deposit' ? 'Пополнение' :
                           t.type === 'withdraw' ? 'Снятие' :
                           t.type === 'order' ? 'Заказ' :
                           t.type === 'refund' ? 'Возврат' :
                           t.type || 'Неизвестно'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                        {t.amount ? (
                          <>
                            {Number(t.amount).toLocaleString('ru-RU')} {t.currency || 'KGS'}
                          </>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: t.status === 'success' ? '#d1fae5' :
                                     t.status === 'pending' ? '#fef3c7' :
                                     t.status === 'failed' ? '#fee2e2' :
                                     '#f3f4f6',
                          color: t.status === 'success' ? '#065f46' :
                                t.status === 'pending' ? '#92400e' :
                                t.status === 'failed' ? '#991b1b' :
                                '#374151'
                        }}>
                          {t.status === 'success' ? 'Успешно' :
                           t.status === 'pending' ? 'Ожидание' :
                           t.status === 'failed' ? 'Ошибка' :
                           t.status === 'refunded' ? 'Возвращено' :
                           t.status || 'Неизвестно'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {t.method || '—'}
                      </td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '12px' }}>
                        {t.reference || '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <button
                          className="button"
                          onClick={() => openTransactionDetails(t)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Просмотр
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {total && total > limit && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  padding: '16px',
                  borderTop: '1px solid var(--gray-200)'
                }}>
                  <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                    Показаны {((page - 1) * limit) + 1}-{Math.min(page * limit, total || 0)} из {total} транзакций
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value))
                        setPage(1)
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '4px'
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>

                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '4px',
                        background: page === 1 ? 'var(--gray-100)' : 'white',
                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Назад
                    </button>

                    <span style={{ fontSize: '14px', margin: '0 8px' }}>
                      Страница {page} из {Math.ceil((total || 0) / limit)}
                    </span>

                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!total || page >= Math.ceil(total / limit)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '4px',
                        background: (!total || page >= Math.ceil(total / limit)) ? 'var(--gray-100)' : 'white',
                        cursor: (!total || page >= Math.ceil(total / limit)) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Вперед →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedTransaction && (
        <TransactionDetailModal
          tx={selectedTransaction}
          onClose={closeTransactionDetails}
          onUpdated={loadTransactions}
        />
      )}
    </div>
  )
}


