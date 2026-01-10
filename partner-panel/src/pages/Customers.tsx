import { useEffect, useState } from 'react'
import { fetchPartnerCustomers } from '../api/client'

type Customer = {
  id: string | number
  name: string
  email?: string
  phone?: string
  ordersCount?: number
  totalSpent?: number
  lastOrderDate?: string
  createdAt?: string
}

export default function Customers({ onError }: { onError?: (msg: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await fetchPartnerCustomers()
      const customersList = Array.isArray(data) ? data : (data.items || data.data || [])
      setCustomers(customersList)
    } catch (err: any) {
      console.error('Error loading customers:', err)
      onError?.('Ошибка загрузки клиентов')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        Загрузка клиентов...
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--gray-900)',
          margin: 0
        }}>
          Мои клиенты
        </h1>
        <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
          Всего: {customers.length} клиентов
        </div>
      </div>

      {/* Search */}
      <div style={{
        marginBottom: '24px',
        maxWidth: '400px'
      }}>
        <input
          type="text"
          placeholder="Поиск по имени, email или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid var(--gray-300)',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: 'var(--white)',
            color: 'var(--gray-900)'
          }}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--gray-500)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--gray-700)' }}>
            {searchTerm ? 'Клиенты не найдены' : 'У вас пока нет клиентов'}
          </h3>
          <p>
            {searchTerm
              ? 'Попробуйте изменить параметры поиска'
              : 'Клиенты появятся здесь после совершения первых покупок'
            }
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--white)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: 'var(--gray-50)',
            borderBottom: '1px solid var(--gray-200)',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--gray-700)'
          }}>
            <div>Клиент</div>
            <div>Контакты</div>
            <div>Заказы</div>
            <div>Потрачено</div>
            <div>Последний заказ</div>
          </div>

          {/* Table Body */}
          <div>
            {filteredCustomers.map((customer, index) => (
              <div key={customer.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: index < filteredCustomers.length - 1 ? '1px solid var(--gray-100)' : 'none',
                alignItems: 'center'
              }}>
                {/* Customer Info */}
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    marginBottom: '4px'
                  }}>
                    {customer.name}
                  </div>
                  {customer.createdAt && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)'
                    }}>
                      Клиент с {new Date(customer.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div>
                  {customer.email && (
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--gray-700)',
                      marginBottom: '2px'
                    }}>
                      📧 {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--gray-700)'
                    }}>
                      📱 {customer.phone}
                    </div>
                  )}
                </div>

                {/* Orders Count */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--blue-600)'
                }}>
                  {customer.ordersCount || 0}
                </div>

                {/* Total Spent */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--green-600)'
                }}>
                  {customer.totalSpent ? customer.totalSpent.toLocaleString() + ' ₽' : '0 ₽'}
                </div>

                {/* Last Order */}
                <div style={{
                  fontSize: '14px',
                  color: 'var(--gray-600)'
                }}>
                  {customer.lastOrderDate
                    ? new Date(customer.lastOrderDate).toLocaleDateString('ru-RU')
                    : 'Нет заказов'
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {customers.length > 0 && (
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'var(--white)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--blue-600)' }}>
              {customers.length}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
              Всего клиентов
            </div>
          </div>

          <div style={{
            background: 'var(--white)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green-600)' }}>
              {customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0)}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
              Всего заказов
            </div>
          </div>

          <div style={{
            background: 'var(--white)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--emerald-600)' }}>
              {customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()} ₽
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
              Общая выручка
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
