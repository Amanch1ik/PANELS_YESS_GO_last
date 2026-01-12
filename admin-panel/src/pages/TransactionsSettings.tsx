import React, { useState, useEffect } from 'react'

interface ColumnSettings {
  id: boolean
  date: boolean
  user: boolean
  type: boolean
  amount: boolean
  currency: boolean
  status: boolean
  reference: boolean
  partner: boolean
  method: boolean
}

const defaultColumns: ColumnSettings = {
  id: true,
  date: true,
  user: true,
  type: true,
  amount: true,
  currency: true,
  status: true,
  reference: false,
  partner: false,
  method: false
}

const columnLabels: Record<keyof ColumnSettings, string> = {
  id: 'ID',
  date: 'Дата',
  user: 'Пользователь',
  type: 'Тип',
  amount: 'Сумма',
  currency: 'Валюта',
  status: 'Статус',
  reference: 'Reference',
  partner: 'Партнёр',
  method: 'Метод оплаты'
}

export default function TransactionsSettings() {
  const [columns, setColumns] = useState<ColumnSettings>(defaultColumns)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('transactions-columns')
    if (saved) {
      try {
        setColumns({ ...defaultColumns, ...JSON.parse(saved) })
      } catch (e) {
        console.warn('Failed to parse column settings', e)
      }
    }
  }, [])

  const handleChange = (key: keyof ColumnSettings) => {
    setColumns(prev => {
      const newSettings = { ...prev, [key]: !prev[key] }
      localStorage.setItem('transactions-columns', JSON.stringify(newSettings))
      // Notify same-window listeners that settings changed
      try { window.dispatchEvent(new Event('transactions-columns-changed')) } catch (e) {}
      return newSettings
    })
  }

  const resetToDefault = () => {
    setColumns(defaultColumns)
    localStorage.setItem('transactions-columns', JSON.stringify(defaultColumns))
    try { window.dispatchEvent(new Event('transactions-columns-changed')) } catch (e) {}
  }

  const visibleCount = Object.values(columns).filter(Boolean).length

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: 'var(--gray-900)', textShadow: 'none' }}>
          Настройки колонок транзакций
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button" onClick={resetToDefault}>
            Сбросить настройки
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>
            Видимые колонки: {visibleCount} из {Object.keys(columns).length}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12
          }}>
            {(Object.keys(columns) as Array<keyof ColumnSettings>).map(key => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  border: '1px solid var(--gray-200)',
                  borderRadius: 8,
                  background: columns[key] ? 'var(--green-50)' : 'var(--white)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={columns[key]}
                  onChange={() => handleChange(key)}
                  style={{ margin: 0 }}
                />
                <span style={{
                  fontSize: 14,
                  color: columns[key] ? 'var(--green-700)' : 'var(--gray-700)'
                }}>
                  {columnLabels[key]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{
          padding: 16,
          background: 'var(--gray-50)',
          borderRadius: 8,
          border: '1px solid var(--gray-200)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--gray-900)' }}>
            Предпросмотр таблицы
          </h4>

          <div style={{ overflowX: 'auto', background: 'var(--white)', padding: 8, borderRadius: 8, border: '1px solid var(--gray-100)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                  {Object.entries(columns).map(([key, visible]) => visible && (
                    <th key={key} style={{ padding: '8px 12px', background: 'var(--gray-100)' }}>
                      {columnLabels[key as keyof ColumnSettings]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  {Object.entries(columns).map(([key, visible]) => visible && (
                    <td key={key} style={{ padding: '8px 12px', color: 'var(--gray-600)' }}>
                      {key === 'id' && '12345'}
                      {key === 'date' && '2024-01-15 14:30'}
                      {key === 'user' && 'john@example.com'}
                      {key === 'type' && 'deposit'}
                      {key === 'amount' && '1000.00'}
                      {key === 'currency' && 'KGS'}
                      {key === 'status' && 'success'}
                      {key === 'reference' && 'REF123456'}
                      {key === 'partner' && 'Partner ABC'}
                      {key === 'method' && 'card'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{
          marginTop: 20,
          padding: 16,
          background: 'var(--blue-50)',
          borderRadius: 8,
          border: '1px solid var(--blue-200)'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--blue-800)' }}>
            💡 Советы
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--blue-700)', fontSize: 14 }}>
            <li>Минимально необходимое количество колонок: ID, Дата, Сумма, Статус</li>
            <li>Для детального анализа добавьте Reference и Метод оплаты</li>
            <li>Настройки сохраняются автоматически в браузере</li>
            <li>Изменения применятся при следующем просмотре страницы транзакций</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

