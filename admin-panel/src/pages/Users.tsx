import React, { useEffect, useState } from 'react'
import SkeletonGrid from '../components/Skeleton'
import { fetchUsers, getUserBalance } from '../api/client'

// Добавляем CSS анимации и responsive стили
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes modalFadeIn {
    0% {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .user-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .user-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .modal-content {
    animation: modalFadeIn 0.3s ease-out;
  }

  .filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: stretch;
  }

  @media (max-width: 768px) {
    .filters-container {
      flex-direction: column;
    }

    .filters-container > div {
      flex: 1 1 auto !important;
      min-width: 0;
    }

    .filters-container .search-input {
      order: 1;
    }

    .filters-container .status-filter {
      order: 2;
    }

    .filters-container .sort-filter {
      order: 3;
    }

    .filters-container .reset-button {
      order: 4;
    }
  }

  @media (max-width: 480px) {
    .filters-container {
      gap: 8px;
    }
  }
`

// Создаем элемент style для добавления CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}

type User = {
  id: string | number
  email?: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  phoneNumber?: string
  createdAt?: string
  created_at?: string
  // PascalCase варианты
  Id?: string | number
  Email?: string
  Name?: string
  FirstName?: string
  LastName?: string
  Phone?: string
  PhoneNumber?: string
  CreatedAt?: string
  Created_At?: string
  // Snake_case варианты (что возвращает API)
  first_name?: string
  last_name?: string
  is_active?: boolean
  // Другие возможные поля
  fullName?: string
  FullName?: string
  username?: string
  Username?: string
}

type UserBalance = {
  balance?: number
  transactions?: number
  points?: number
  currency?: string
}

export default function Users({ onError }: { onError?: (msg: string) => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [totalUsers, setTotalUsers] = useState<number>(0)

  // Модальные окна
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    is_active: true
  })


  useEffect(() => {
    let mounted = true
    setLoading(true)

    // Загружаем реальные данные пользователей
    fetchUsers()
      .then(data => {
        if (!mounted) return
        const userData = Array.isArray(data) ? data : data.items || data.data || []
        const totalCount = data.total || data.count || userData.length

        setUsers(userData)
        setFilteredUsers(userData)
        setTotalUsers(totalCount)

        console.log(`✅ Загружено ${userData.length} пользователей из ${totalCount} в базе данных`)
      })
      .catch(err => {
        const msg = err?.response?.data?.message || err.message || 'Ошибка загрузки пользователей'
        console.error('❌ Ошибка загрузки пользователей:', msg)

        if (err?.response?.status === 401) {
          // Только для других 401 ошибок (не API недоступен) перенаправляем на логин
          console.warn('🔐 Токен истек, перенаправление на страницу входа...')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          setError('Сессия истекла. Перенаправление на страницу входа...')
        } else {
          setError(msg)
          onError?.(msg)
        }
      })
      .finally(() => setLoading(false))

    return () => { mounted = false }

    return () => { mounted = false }
  }, [])

  // Функции для работы с пользователями
  const openUserModal = async (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
    setIsEditing(false)
    setBalanceLoading(true)

    // Инициализируем форму редактирования
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      email: user.email || '',
      is_active: user.is_active !== false
    })

    try {
      const balanceData = await getUserBalance(user.id)
      setUserBalance(balanceData)
    } catch (error) {
      console.warn('Error fetching user balance:', error)
      // В случае ошибки показываем пустой баланс
      setUserBalance({
        balance: 0,
        transactions: 0,
        points: 0
      })
    } finally {
      setBalanceLoading(false)
    }
  }

  const startEditing = () => {
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    if (selectedUser) {
      setEditForm({
        first_name: selectedUser.first_name || '',
        last_name: selectedUser.last_name || '',
        phone: selectedUser.phone || '',
        email: selectedUser.email || '',
        is_active: selectedUser.is_active !== false
      })
    }
  }

  const saveUserChanges = async () => {
    if (!selectedUser) return

    try {
      // Имитируем сохранение (в реальном приложении здесь был бы API вызов)
      console.log('Saving user changes:', editForm)

      // Обновляем локальные данные
      const updatedUser = { ...selectedUser, ...editForm }
      const updatedUsers = users.map(u => u.id === selectedUser.id ? updatedUser : u)
      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers.filter(u => {
        // Применяем текущие фильтры к обновленным данным
        if (filterStatus === 'active' && u.is_active === false) return false
        if (filterStatus === 'inactive' && u.is_active !== false) return false

        if (searchTerm) {
          const displayName = u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` :
                             u.first_name || u.last_name ||
                             u.name || u.Name ||
                             u.email || u.Email ||
                             `Пользователь ${u.id}`
          return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 String(u.id).includes(searchTerm) ||
                 (u.phone || '').includes(searchTerm) ||
                 (u.email || '').toLowerCase().includes(searchTerm)
        }

        return true
      }))

      setSelectedUser(updatedUser)
      setIsEditing(false)

      // Показываем уведомление об успехе
      console.log('Пользователь успешно обновлен')
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const closeUserModal = () => {
    setSelectedUser(null)
    setShowUserModal(false)
    setUserBalance(null)
  }

  // Фильтрация и сортировка пользователей
  useEffect(() => {
    let filtered = [...users]

    // Фильтр по статусу
    if (filterStatus === 'active') {
      filtered = filtered.filter(u => u.is_active !== false)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(u => u.is_active === false)
    }

    // Поиск
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(u => {
        const displayName = u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` :
                           u.first_name || u.last_name ||
                           u.name || u.Name ||
                           u.email || u.Email ||
                           `Пользователь ${u.id}`
        return displayName.toLowerCase().includes(term) ||
               String(u.id).includes(term) ||
               (u.phone || u.Phone || '').includes(term) ||
               (u.email || u.Email || '').toLowerCase().includes(term)
      })
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.first_name && a.last_name ? `${a.first_name} ${a.last_name}` :
                  a.first_name || a.last_name ||
                  a.name || a.Name ||
                  a.email || a.Email ||
                  `Пользователь ${a.id}`
          bValue = b.first_name && b.last_name ? `${b.first_name} ${b.last_name}` :
                  b.first_name || b.last_name ||
                  b.name || b.Name ||
                  b.email || b.Email ||
                  `Пользователь ${b.id}`
          break
        case 'id':
          aValue = a.id
          bValue = b.id
          break
        case 'date':
          aValue = new Date(a.created_at || a.createdAt || 0).getTime()
          bValue = new Date(b.created_at || b.createdAt || 0).getTime()
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, sortBy, sortOrder, filterStatus])

  return (
    <div className="container">
      {/* Индикатор статуса аутентификации */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: 'var(--gray-50)',
        borderRadius: '8px',
        border: '1px solid var(--gray-200)',
        fontSize: '12px',
        color: 'var(--gray-600)'
      }}>
        <strong>Статус аутентификации:</strong>
        {localStorage.getItem('yessgo_access_token') ? (
          <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>
            ✅ Авторизован (токен присутствует)
          </span>
        ) : (
          <span style={{ color: '#dc2626', marginLeft: '8px' }}>
            ❌ Не авторизован (войдите в систему как администратор)
          </span>
        )}
      </div>

      {/* Заголовок с счетчиком */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '20px',
        background: 'var(--gradient-primary)',
        borderRadius: '16px',
        color: 'var(--white)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            👥 Пользователи
          </h2>
          <p style={{
            margin: 0,
            opacity: 0.9,
            fontSize: '14px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            Управление пользователями системы
            {!loading && totalUsers > 0 && (
              <span style={{ display: 'block', fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                Показано {users.length} из {totalUsers} пользователей
              </span>
            )}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Статистика */}
          <div style={{
            textAlign: 'center',
            padding: '12px 20px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {loading ? '...' : totalUsers || filteredUsers.length}
            </div>
            <div style={{
              fontSize: '12px',
              opacity: 0.9,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              Всего пользователей
            </div>
          </div>

          {/* Активные пользователи */}
          <div style={{
            textAlign: 'center',
            padding: '12px 20px',
            background: 'var(--white)',
            borderRadius: '12px',
            border: '2px solid #22c55e',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
              color: '#16a34a',
              textShadow: 'none'
            }}>
              {loading ? '...' : filteredUsers.filter(u => u.is_active !== false).length}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#16a34a',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600',
              textShadow: 'none'
            }}>
              Активных
            </div>
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      {!loading && users.length > 0 && (
        <div style={{
          background: 'var(--white)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid var(--gray-200)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div className="filters-container">
            {/* Поиск */}
            <div className="search-input" style={{
              position: 'relative',
              flex: '1 1 300px',
              minWidth: '200px'
            }}>
                <input
                  type="text"
                  placeholder="Поиск по имени, ID, телефону или email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-300)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(7, 185, 129, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--gray-300)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
                fontSize: '16px',
                pointerEvents: 'none'
              }}>
                🔍
              </div>
            </div>

            {/* Фильтр по статусу */}
            <div className="status-filter" style={{ flex: '0 0 160px' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-300)',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'var(--white)',
                  boxSizing: 'border-box'
                }}
              >
                <option value="all">Все статусы</option>
                <option value="active">Только активные</option>
                <option value="inactive">Только неактивные</option>
              </select>
            </div>

            {/* Сортировка */}
            <div className="sort-filter" style={{ flex: '0 0 180px' }}>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-300)',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'var(--white)',
                  boxSizing: 'border-box'
                }}
              >
                <option value="name-asc">Имя (А-Я)</option>
                <option value="name-desc">Имя (Я-А)</option>
                <option value="id-asc">ID (по возрастанию)</option>
                <option value="id-desc">ID (по убыванию)</option>
                <option value="date-desc">Дата (новые)</option>
                <option value="date-asc">Дата (старые)</option>
              </select>
            </div>

            {/* Кнопка сброса - показывать всегда для лучшего UX */}
            <div className="reset-button" style={{ flex: '0 0 120px' }}>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setSortBy('name')
                  setSortOrder('asc')
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: searchTerm || filterStatus !== 'all' ? 'var(--accent)' : 'var(--gray-100)',
                  color: searchTerm || filterStatus !== 'all' ? 'var(--white)' : 'var(--gray-700)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  const hasActiveFilters = searchTerm || filterStatus !== 'all'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  if (hasActiveFilters) {
                    e.currentTarget.style.background = 'var(--accent-hover)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
                  } else {
                    e.currentTarget.style.background = 'var(--gray-200)'
                  }
                }}
                onMouseLeave={(e) => {
                  const hasActiveFilters = searchTerm || filterStatus !== 'all'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  if (hasActiveFilters) {
                    e.currentTarget.style.background = 'var(--accent)'
                  } else {
                    e.currentTarget.style.background = 'var(--gray-100)'
                  }
                }}
              >
                🗑️ Сброс
              </button>
            </div>

            {/* Кнопка обновления данных */}
            <div className="reset-button" style={{ flex: '0 0 140px' }}>
              <button
                onClick={async () => {
                  setLoading(true)
                  setError(null)
                  try {
                    const data = await fetchUsers()
                    const userData = Array.isArray(data) ? data : data.items || data.data || []
                    const totalCount = data.total || data.count || userData.length

                    setUsers(userData)
                    setFilteredUsers(userData)
                    setTotalUsers(totalCount)
                    console.log(`✅ Обновлено: ${userData.length} пользователей из ${totalCount} в базе данных`)
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || err.message || 'Ошибка загрузки пользователей'
                    console.error('❌ Ошибка обновления:', msg)

                    if (err?.response?.status === 401) {
                      console.warn('🔐 Токен истек при обновлении')
                      setTimeout(() => {
                        window.location.href = '/login'
                      }, 2000)
                      setError('Сессия истекла. Перенаправление на страницу входа...')
                    } else {
                      setError(msg)
                    }
                  } finally {
                    setLoading(false)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--gray-100)',
                  color: 'var(--gray-700)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--gray-200)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--gray-100)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                🔄 Обновить
              </button>
            </div>
          </div>

          {/* Статистика фильтров и пагинация */}
          <div style={{
            width: '100%',
            marginTop: '12px',
            padding: '8px 12px',
            background: 'var(--gray-50)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--gray-600)',
            border: '1px solid var(--gray-200)',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Показаны:</strong> {filteredUsers.length} из {totalUsers || users.length} пользователей
              {searchTerm && ` • Поиск: "${searchTerm}"`}
              {filterStatus !== 'all' && ` • Статус: ${filterStatus === 'active' ? 'активные' : 'неактивные'}`}
            </div>

            {totalUsers > users.length && (
              <div style={{
                color: 'var(--gray-500)',
                fontSize: '11px'
              }}>
                📄 Страница 1 из {Math.ceil(totalUsers / users.length)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        {loading && (
          <div style={{ padding: 12 }}>
            <SkeletonGrid count={6} columns={2} />
          </div>
        )}

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px',
            color: '#ef4444',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {error.includes('401') || error.includes('Unauthorized')
                ? 'Недостаточно прав доступа'
                : 'Ошибка загрузки'}
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.8,
              marginBottom: '16px'
            }}>
              {error.includes('401') || error.includes('Unauthorized')
                ? 'У вас нет прав администратора для просмотра списка пользователей. Обратитесь к системному администратору для получения соответствующих прав.'
                : error}
            </div>
            {error.includes('401') || error.includes('Unauthorized') ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                marginTop: '12px'
              }}>
                <strong>Возможные решения:</strong>
                <ul style={{ textAlign: 'left', marginTop: '8px' }}>
                  <li>Войдите в систему под учетной записью администратора</li>
                  <li>Обратитесь к администратору системы для получения прав</li>
                  <li>Проверьте, что ваш токен доступа действителен</li>
                </ul>
              </div>
            ) : null}
            <button
              onClick={() => {
                setError(null)
                // Повторно загружаем данные
                let mounted = true
                setLoading(true)
                fetchUsers()
                  .then(data => {
                    if (!mounted) return
                    const userData = Array.isArray(data) ? data : data.items || data.data || []
                    setUsers(userData)
                    setFilteredUsers(userData)
                  })
                  .catch(err => {
                    const msg = err?.response?.data?.message || err.message || 'Ошибка загрузки пользователей'
                    setError(msg)
                    onError?.(msg)
                  })
                  .finally(() => setLoading(false))
                return () => { mounted = false }
              }}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: 'var(--accent)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              🔄 Повторить попытку
            </button>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && !error && users.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--gray-500)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>👤</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Нет пользователей</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Пользователи еще не зарегистрированы в системе</div>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && !error && users.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--gray-500)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Ничего не найдено</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Попробуйте изменить параметры поиска или фильтры
            </div>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
            }}>
              {filteredUsers.map(u => {
            // Определяем имя пользователя (проверяем все возможные варианты)
            const displayName = u.name || u.Name || u.fullName || u.FullName ||
                               // Snake_case поля (основные)
                               (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : null) ||
                               (u.first_name ? u.first_name : null) ||
                               (u.last_name ? u.last_name : null) ||
                               // CamelCase поля
                               (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) ||
                               (u.FirstName && u.LastName ? `${u.FirstName} ${u.LastName}` : null) ||
                               (u.firstName ? u.firstName : null) ||
                               (u.FirstName ? u.FirstName : null) ||
                               (u.lastName ? u.lastName : null) ||
                               (u.LastName ? u.LastName : null) ||
                               // Остальные варианты
                               u.username || u.Username ||
                               // НЕ используем email как имя, только если нет других вариантов
                               (u.phone || u.Phone ? `Пользователь ${u.phone || u.Phone}` : null) ||
                               `Пользователь ${String(u.id)}`

            // Определяем контактную информацию (телефон или email)
            const contactInfo = u.phone || u.Phone || u.phoneNumber || u.PhoneNumber ||
                               u.email || u.Email || 'Нет контакта'

            // Определяем дату создания
            const createdDate = u.createdAt || u.CreatedAt || u.created_at || u.Created_At

            return (
              <div key={String(u.id)} className="user-card" style={{
                background: 'var(--white)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}
              >
                {/* ID пользователя в углу */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--gray-100)',
                  color: 'var(--gray-600)',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  border: '1px solid var(--gray-200)'
                }}>
                  #{String(u.id).padStart(3, '0')}
                </div>

                {/* Основная информация */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--white)',
                    fontSize: '20px',
                    fontWeight: '700',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'var(--gray-900)',
                      fontSize: '18px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      lineHeight: '1.2'
                    }}>
                      {displayName}
                    </div>

                    <div style={{
                      color: 'var(--accent)',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{contactInfo.startsWith('+996') ? '📱' : '✉️'}</span>
                      <span>{contactInfo}</span>
                    </div>

                    {/* Статус и дата в одной строке */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: u.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: u.is_active ? '#16a34a' : '#dc2626',
                        border: `1px solid ${u.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: u.is_active ? '#16a34a' : '#dc2626'
                        }}></span>
                        {u.is_active ? 'Активен' : 'Неактивен'}
                      </div>

                      {createdDate && (
                        <div style={{
                          color: 'var(--gray-500)',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>📅</span>
                          {new Date(createdDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--gray-100)'
                }}>
                  <button
                    onClick={() => openUserModal(u)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'var(--gradient-primary)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    👁️ Просмотр
                  </button>

                  <button
                    onClick={() => {
                      openUserModal(u)
                      setTimeout(() => setIsEditing(true), 100) // Небольшая задержка для инициализации модального окна
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'var(--accent)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.4)'
                      e.currentTarget.style.background = 'var(--accent-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.background = 'var(--accent)'
                    }}
                  >
                    ✏️ Быстрое редактирование
                  </button>
                </div>
              </div>
            )
          })}
            </div>
          </div>
        )}

        {/* Модальное окно пользователя */}
        {showUserModal && selectedUser && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeUserModal}
          >
            <div className="modal-content" style={{
              background: 'var(--white)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--gray-200)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок модального окна */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--gray-100)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--white)',
                    fontSize: '24px',
                    fontWeight: '700',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }}>
                    {selectedUser.first_name?.charAt(0) || selectedUser.name?.charAt(0) || 'П'}
                  </div>
                  <div>
                    <h2 style={{
                      margin: '0 0 4px 0',
                      fontSize: '24px',
                      fontWeight: '700',
                      color: 'var(--gray-900)'
                    }}>
                      {selectedUser.first_name && selectedUser.last_name
                        ? `${selectedUser.first_name} ${selectedUser.last_name}`
                        : selectedUser.name || 'Пользователь'}
                    </h2>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--gray-500)',
                      fontFamily: 'monospace'
                    }}>
                      ID: {selectedUser.id}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeUserModal}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--gray-100)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: 'var(--gray-600)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--gray-200)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gray-100)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Основная информация */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {isEditing ? (
                  // Форма редактирования
                  <div>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--gray-900)'
                    }}>
                      ✏️ Редактирование пользователя
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--gray-700)',
                          marginBottom: '6px'
                        }}>
                          Имя
                        </label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--gray-300)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="Введите имя"
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--gray-700)',
                          marginBottom: '6px'
                        }}>
                          Фамилия
                        </label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--gray-300)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="Введите фамилию"
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--gray-700)',
                          marginBottom: '6px'
                        }}>
                          Телефон
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--gray-300)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="+996XXXXXXXXX"
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--gray-700)',
                          marginBottom: '6px'
                        }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--gray-300)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--gray-700)',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>Пользователь активен</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  // Отображение информации
                  <>
                    <div>
                      <h3 style={{
                        margin: '0 0 12px 0',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--gray-900)'
                      }}>
                        📞 Контактная информация
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          padding: '8px 12px',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}>
                          <strong>Телефон:</strong> {selectedUser.phone || selectedUser.Phone || 'Не указан'}
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}>
                          <strong>Email:</strong> {selectedUser.email || selectedUser.Email || 'Не указан'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 style={{
                        margin: '0 0 12px 0',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--gray-900)'
                      }}>
                        📊 Статус и дата
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          padding: '8px 12px',
                          background: selectedUser.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: selectedUser.is_active ? '#16a34a' : '#dc2626',
                          fontWeight: '600'
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: selectedUser.is_active ? '#16a34a' : '#dc2626',
                            display: 'inline-block',
                            marginRight: '6px'
                          }}></span>
                          {selectedUser.is_active ? 'Активен' : 'Неактивен'}
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}>
                          <strong>Регистрация:</strong><br />
                          {(() => {
                            const dateValue = selectedUser.created_at || selectedUser.createdAt;
                            if (!dateValue) return 'Неизвестно';
                            try {
                              return new Date(dateValue).toLocaleString('ru-RU');
                            } catch {
                              return 'Неизвестно';
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Баланс Yess!Coins */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                color: 'white'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💰 Баланс Yess!Coins
                </h3>

                {balanceLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '3px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px auto'
                    }}></div>
                    Загрузка баланса Yess!Coins...
                  </div>
                ) : userBalance ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          {userBalance.balance || 0}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          opacity: 0.9
                        }}>
                          Доступно
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          {userBalance.transactions || 0}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          opacity: 0.9
                        }}>
                          Транзакций
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          {userBalance.points || 0}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          opacity: 0.9
                        }}>
                          Очков
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    Баланс недоступен
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '20px',
                borderTop: '1px solid var(--gray-100)'
              }}>
                {isEditing ? (
                  // Кнопки режима редактирования
                  <>
                    <button
                      onClick={saveUserChanges}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: 'var(--gradient-primary)',
                        color: 'var(--white)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      💾 Сохранить изменения
                    </button>

                    <button
                      onClick={cancelEditing}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gray-200)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--gray-100)'
                      }}
                    >
                      ❌ Отменить
                    </button>
                  </>
                ) : (
                  // Кнопки режима просмотра
                  <>
                    <button
                      onClick={startEditing}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: 'var(--gradient-primary)',
                        color: 'var(--white)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      ✏️ Редактировать профиль
                    </button>

                    <button
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gray-200)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--gray-100)'
                      }}
                    >
                      📊 История транзакций
                    </button>
                  </>
                )}

                <button
                  onClick={closeUserModal}
                  style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    color: 'var(--gray-600)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--gray-50)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gray-50)'
                  }}
                >
                  ✕ Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


