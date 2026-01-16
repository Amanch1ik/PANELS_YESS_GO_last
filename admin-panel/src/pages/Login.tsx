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

  @keyframes loginShake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(5px);
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
      // Immediately navigate to home to show app shell quickly while data loads
      try {
        pushToast({ type: 'success', title: 'Вход выполнен', message: 'Успешный вход в систему' })
        // call onLogin for in-memory state, then do a hard navigation to ensure Router mounts quickly with token present
        try { onLogin() } catch { /* ignore */ }
        // use location replace to avoid keeping login in history
        window.location.replace('/home')
      } catch (e) {
        // fallback: still call onLogin
        try { onLogin() } catch {}
      }
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
      background: 'linear-gradient(135deg, #07B981 0%, #34d399 25%, #10b981 50%, #059669 75%, #047857 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Анимированный фон с частицами */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px), radial-gradient(circle at 40% 20%, white 1.5px, transparent 1.5px)',
        backgroundSize: '200px 200px, 300px 300px, 250px 250px',
        animation: 'particlesFloat 20s linear infinite'
      }}></div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes particlesFloat {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50px, -50px); }
        }
      `}</style>

      <div className="login-card" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1
      }}>
        {/* Декоративные элементы */}
        <div className="login-decorative-1" style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(7, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>

        <div className="login-decorative-2" style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, rgba(7, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
          <div className="login-title" style={{
            fontSize: '42px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #07B981 0%, #34d399 50%, #667eea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            YESS!GO
          </div>
          <div className="login-subtitle" style={{
            fontSize: '16px',
            color: 'var(--gray-600)',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}>
            Панель Администратора
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div className="login-form-group" style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'var(--gray-700)',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '10px',
              textTransform: 'none',
              letterSpacing: '0.2px'
            }}>
              Имя пользователя
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '18px 20px 18px 56px',
                  borderRadius: '14px',
                  border: '2px solid rgba(7, 185, 129, 0.2)',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: 'var(--gray-800)',
                  fontSize: '15px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#07B981';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(7, 185, 129, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(7, 185, 129, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              />
              <div className="login-icon-user" style={{
                position: 'absolute',
                left: '18px',
                top: '0',
                bottom: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                lineHeight: '1',
                pointerEvents: 'none',
                margin: 'auto 0'
              }}>
                👤
              </div>
            </div>
          </div>

          <div className="login-password-group" style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              color: 'var(--gray-700)',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '10px',
              textTransform: 'none',
              letterSpacing: '0.2px'
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
                  padding: '18px 56px 18px 56px',
                  borderRadius: '14px',
                  border: '2px solid rgba(7, 185, 129, 0.2)',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: 'var(--gray-800)',
                  fontSize: '15px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#07B981';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(7, 185, 129, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(7, 185, 129, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              />
              <div className="login-icon-lock" style={{
                position: 'absolute',
                left: '18px',
                top: '0',
                bottom: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                lineHeight: '1',
                pointerEvents: 'none',
                margin: 'auto 0'
              }}>
                🔒
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                style={{
                  position: 'absolute',
                  right: '18px',
                  top: '0',
                  bottom: '0',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '22px',
                  lineHeight: '1',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  borderRadius: '6px',
                  margin: 'auto 0'
                }}
                onMouseEnter={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.transform = 'scale(1.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '24px',
              color: '#dc2626',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '500',
              backdropFilter: 'blur(10px)',
              animation: 'loginShake 0.5s ease-in-out'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading 
                ? 'linear-gradient(135deg, rgba(7, 185, 129, 0.6) 0%, rgba(52, 211, 153, 0.6) 100%)'
                : 'linear-gradient(135deg, #07B981 0%, #34d399 100%)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: loading
                ? '0 4px 12px rgba(7, 185, 129, 0.3)'
                : '0 10px 30px rgba(7, 185, 129, 0.5), 0 0 0 0 rgba(7, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              letterSpacing: '0.3px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading && e.target instanceof HTMLElement) {
                e.target.style.background = 'linear-gradient(135deg, #34d399 0%, #07B981 100%)';
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 40px rgba(7, 185, 129, 0.6), 0 0 0 4px rgba(7, 185, 129, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && e.target instanceof HTMLElement) {
                e.target.style.background = 'linear-gradient(135deg, #07B981 0%, #34d399 100%)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(7, 185, 129, 0.5), 0 0 0 0 rgba(7, 185, 129, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <div className="loading" style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderWidth: '3px',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white'
                }}></div>
                <span>Вход в систему...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '18px' }}>🚀</span>
                <span>Войти</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer" style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(7, 185, 129, 0.1)',
          color: 'var(--gray-500)',
          fontSize: '13px',
          fontWeight: '500',
          letterSpacing: '0.2px',
          position: 'relative',
          zIndex: 2
        }}>
          YESS!GO - вход для администраторов
        </div>
      </div>
    </div>
  )
}


