import React, { useState, useEffect } from 'react'
import { login, setAuthToken } from '../api/client'
import { useNotification } from '../contexts/NotificationContext'

// CSS анимации для страницы логина
const styles = `
  @keyframes loginFadeInUp {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes loginSlideInLeft {
    0% {
      opacity: 0;
      transform: translateX(-30px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes loginSlideInRight {
    0% {
      opacity: 0;
      transform: translateX(30px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes loginBounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes loginGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(7, 185, 129, 0.3);
    }
    50% {
      box-shadow: 0 0 40px rgba(7, 185, 129, 0.6), 0 0 60px rgba(7, 185, 129, 0.3);
    }
  }

  @keyframes loginFloat {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-10px) rotate(1deg);
    }
    66% {
      transform: translateY(5px) rotate(-1deg);
    }
  }

  @keyframes loginPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .login-card {
    animation: loginFadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .login-title {
    animation: loginBounceIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
  }

  .login-subtitle {
    animation: loginFadeInUp 0.6s ease-out 0.4s both;
  }

  .login-form-group {
    animation: loginSlideInLeft 0.6s ease-out 0.6s both;
  }

  .login-password-group {
    animation: loginSlideInRight 0.6s ease-out 0.8s both;
  }

  .login-button {
    animation: loginBounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 1s both;
    position: relative;
    overflow: hidden;
  }

  .login-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: loginShimmer 2s infinite;
  }

  @keyframes loginShimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .login-footer {
    animation: loginFadeInUp 0.6s ease-out 1.2s both;
  }

  .login-decorative-1 {
    animation: loginFloat 6s ease-in-out infinite;
  }

  .login-decorative-2 {
    animation: loginFloat 8s ease-in-out infinite reverse;
  }

  .login-input:focus {
    animation: loginGlow 0.3s ease-out forwards;
  }

  .login-icon-user {
    animation: loginPulse 2s ease-in-out infinite;
  }

  .login-icon-lock {
    animation: loginPulse 2s ease-in-out infinite 0.5s;
  }
`

// Создаем элемент style
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}

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
      <div className="login-card" style={{
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
        <div className="login-decorative-1" style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'var(--accent)',
          borderRadius: '50%',
          opacity: 0.1
        }}></div>

        <div className="login-decorative-2" style={{
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
          <div className="login-title" style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--accent)',
            textShadow: 'none',
            marginBottom: '8px'
          }}>
            YESS!GO
          </div>
          <div className="login-subtitle" style={{
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
          <div className="login-form-group" style={{ marginBottom: '20px' }}>
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
                className="login-input"
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
              />
              <div className="login-icon-user" style={{
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

          <div className="login-password-group" style={{ marginBottom: '24px' }}>
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
                className="login-input"
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
              <div className="login-icon-lock" style={{
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
            className="login-button"
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
        <div className="login-footer" style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--gray-200)',
          color: 'var(--gray-500)',
          fontSize: '12px'
        }}>
          YESS!GO - вход для администраторов
        </div>
      </div>
    </div>
  )
}


