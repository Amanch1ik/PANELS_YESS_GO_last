import React, { useState } from 'react'
import { login, setAuthToken } from '../api/client'
import { useNotification } from '../contexts/NotificationContext'

export default function Login({ onLogin, onError }: { onLogin: () => void, onError?: (msg: string) => void }) {
  const { pushToast } = useNotification()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login(username.trim(), password)
      const token = (data?.token) || (data?.accessToken) || null
      if (!token) {
        const msg = 'API не вернул токен авторизации'
        setError(msg)
        onError?.(msg)
        pushToast({ type: 'error', title: 'Ошибка входа', message: msg })
        return
      }
      setAuthToken(token)
      onLogin()
      pushToast({ type: 'success', title: 'Вход выполнен', message: 'Успешный вход в систему' })
    } catch (err: any) {
      console.error('Login error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err.message,
        url: err?.config?.url,
        method: err?.config?.method
      })

      let msg = 'Ошибка входа в систему'
      if (err?.response?.status === 401) {
        msg = 'Неверный номер телефона или пароль'
      } else if (err?.response?.status === 400) {
        msg = err?.response?.data?.message || 'Некорректные данные для входа'
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message
      } else if (err.message) {
        msg = err.message
      }

      setError(msg)
      onError?.(msg)
      pushToast({ type: 'error', title: 'Ошибка входа', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gradient-bg)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--gray-200)',
        maxWidth: '450px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Декоративный элемент */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'var(--accent)',
          borderRadius: '50%',
          opacity: 0.1
        }}></div>

        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '60px',
          height: '60px',
          background: 'var(--accent-light)',
          borderRadius: '50%',
          opacity: 0.1
        }}></div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--accent)',
            textShadow: 'none',
            marginBottom: '8px'
          }}>
            YESS!GO
          </div>
          <div style={{
            fontSize: '18px',
            color: 'var(--gray-600)',
            fontWeight: '500',
            textShadow: 'none'
          }}>
            Панель Администратора
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: 'var(--gray-700)',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Имя пользователя
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '16px 20px 16px 50px',
                  borderRadius: '12px',
                  border: '1px solid rgba(7, 185, 129, 0.3)',
                  background: 'rgba(7, 185, 129, 0.05)',
                  color: 'var(--gray-800)',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(7, 185, 129, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent)',
                fontSize: '18px'
              }}>
                👤
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'var(--gray-700)',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите ваш пароль"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '16px 20px 16px 50px',
                  borderRadius: '12px',
                  border: '1px solid rgba(7, 185, 129, 0.3)',
                  background: 'rgba(7, 185, 129, 0.05)',
                  color: 'var(--gray-800)',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(7, 185, 129, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent)',
                fontSize: '18px'
              }}>
                🔒
              </div>
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'var(--accent)'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#ef4444',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? 'rgba(7, 185, 129, 0.6)' : 'var(--gradient-primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(3, 83, 58, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'var(--gradient-secondary)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 30px rgba(3, 83, 58, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'var(--gradient-primary)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(3, 83, 58, 0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <div className="loading" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                Вход...
              </>
            ) : (
              <>
                🚀 Войти
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--gray-200)',
          color: 'var(--gray-500)',
          fontSize: '12px'
        }}>
          Административная панель YESSGO - вход для администраторов
        </div>
      </div>
    </div>
  )
}


