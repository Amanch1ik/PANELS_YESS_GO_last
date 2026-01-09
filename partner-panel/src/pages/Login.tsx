import { useState } from 'react'
import { partnerLogin } from '../api/client'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    try {
      setLoading(true)
      setError('')

      await partnerLogin(email, password)
      onLogin()
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err?.response?.data?.message ||
                          err?.response?.data?.error ||
                          err?.message ||
                          'Ошибка входа в систему'
      setError(errorMessage)
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo/Brand */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🏪
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '8px'
          }}>
            YESS!GO Partner
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--gray-600)',
            margin: 0
          }}>
            Панель управления магазином
          </p>
        </div>

        {/* Demo Credentials Info */}
        <div style={{
          background: 'var(--blue-50)',
          border: '1px solid var(--blue-200)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: 'var(--blue-800)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>🎯 Демо учетные данные:</div>
          <div><strong>Email:</strong> partner@yessgo.com</div>
          <div><strong>Пароль:</strong> partner123</div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--gray-700)',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--gray-300)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-900)',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--gray-700)',
              marginBottom: '8px'
            }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--gray-300)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-900)',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'var(--red-50)',
              border: '1px solid var(--red-200)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px',
              color: 'var(--red-700)'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--gray-400)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--gray-200)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--gray-500)',
            margin: 0
          }}>
            © 2026 YESS!GO. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  )
}
