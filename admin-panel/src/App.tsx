import React, { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { setAuthToken, hasValidTokens } from './api/client'
import { NotificationProvider } from './contexts/NotificationContext'
import Notifications from './components/Notifications'

// Lazy loading для страниц
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Partners = lazy(() => import('./pages/Partners'))
const PartnerDetail = lazy(() => import('./pages/PartnerDetail'))
const Messages = lazy(() => import('./pages/Messages'))
const Users = lazy(() => import('./pages/Users'))
const Products = lazy(() => import('./pages/Products'))
const Transactions = lazy(() => import('./pages/Transactions'))
const RBACPage = lazy(() => import('./pages/RBAC'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))

// Компонент загрузки
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: 'var(--gray-600)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid var(--gray-200)',
      borderTop: '4px solid var(--accent)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// Компонент навигации
function Navigation() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)

    // Preload критически важных компонентов
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Предварительная загрузка основных страниц
        import('./pages/Partners')
        import('./pages/Users')
      })
    }
  }, [])

  const isActive = (path: string) => currentPath === path

  return (
    <header style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', boxShadow: 'var(--shadow-md)', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--gray-200)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '24px', color: 'var(--accent)', textShadow: 'none' }}>
        <img
          src="/favicon.svg"
          alt="YESS!GO Logo"
          style={{ width: '32px', height: '32px' }}
        />
        YESS!GO Админ
      </div>
      <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/home" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/home') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/home') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/home') ? 'none' : '1px solid var(--gray-300)'
          }}>🏠 Главная</button>
        </Link>
        <Link to="/partners" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/partners') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/partners') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/partners') ? 'none' : '1px solid var(--gray-300)'
          }}>Партнеры</button>
        </Link>
        <Link to="/products" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/products') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/products') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/products') ? 'none' : '1px solid var(--gray-300)'
          }}>Продукты</button>
        </Link>
        <Link to="/transactions" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/transactions') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/transactions') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/transactions') ? 'none' : '1px solid var(--gray-300)'
          }}>Транзакции</button>
        </Link>
        <Link to="/messages" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/messages') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/messages') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/messages') ? 'none' : '1px solid var(--gray-300)'
          }}>Сообщения</button>
        </Link>
        <Link to="/users" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/users') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/users') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/users') ? 'none' : '1px solid var(--gray-300)'
          }}>Пользователи</button>
        </Link>
        <Link to="/rbac" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/rbac') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/rbac') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/rbac') ? 'none' : '1px solid var(--gray-300)'
          }}>Права</button>
        </Link>
        <Link to="/audit" style={{ textDecoration: 'none' }}>
          <button className="button" style={{
            background: isActive('/audit') ? 'var(--accent)' : 'var(--gray-100)',
            color: isActive('/audit') ? 'var(--white)' : 'var(--gray-700)',
            border: isActive('/audit') ? 'none' : '1px solid var(--gray-300)'
          }}>Аудит</button>
        </Link>
        <button className="button" onClick={() => { setAuthToken(null); window.location.href = '/' }} style={{
          background: '#dc2626',
          color: 'var(--white)',
          border: 'none'
        }}>Выйти</button>
      </nav>
    </header>
  )
}

// Основное приложение с маршрутизацией
function AppContent() {
  const [globalError, setGlobalError] = useState<string | null>(null)
  const location = useLocation()
  const onError = (msg: string) => setGlobalError(msg)

  // Проверяем токен при каждом изменении маршрута
  useEffect(() => {
    console.log(`📍 Route changed to ${location.pathname}, validating tokens...`)
    if (!hasValidTokens()) {
      console.warn('🔐 Invalid or missing tokens, redirecting to login...')
      // Clear any invalid tokens
      setAuthToken(null, null)
      window.location.href = '/'
      return
    }
    const token = localStorage.getItem('yessgo_access_token')
    if (token) {
      setAuthToken(token)
    }
  }, [location.pathname])

  return (
    <>
      {globalError && (
        <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: '#fff', padding: 8, textAlign: 'center', borderRadius: '8px' }}>
          {globalError}
          <button className="button" style={{ marginLeft: 12 }} onClick={() => setGlobalError(null)}>Закрыть</button>
        </div>
      )}

      <Navigation />

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home onError={onError} />} />
          <Route path="/partners" element={<Partners onError={onError} />} />
          <Route path="/partners/:id" element={<PartnerDetail onError={onError} />} />
          <Route path="/products" element={<Products onError={onError} />} />
          <Route path="/transactions" element={<Transactions onError={onError} />} />
          <Route path="/messages" element={<Messages onError={onError} />} />
          <Route path="/users" element={<Users onError={onError} />} />
          <Route path="/rbac" element={<RBACPage />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    console.log('🚀 App initialization - checking tokens...')
    if (hasValidTokens()) {
      const token = localStorage.getItem('yessgo_access_token')
      if (token) {
        setAuthToken(token)
        setAuthenticated(true)
        console.log('✅ User authenticated with valid tokens')
      }
    } else {
      console.log('❌ Invalid or missing tokens, user not authenticated')
      // Clear any invalid tokens
      setAuthToken(null, null)
    }
  }, [])

  const onError = (msg: string) => console.error('App Error:', msg)

  if (!authenticated) {
    return (
      <NotificationProvider>
        <Notifications />
          <Login onLogin={() => setAuthenticated(true)} onError={onError} />
      </NotificationProvider>
    )
  }

  return (
    <NotificationProvider>
      <Notifications />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </Router>
    </NotificationProvider>
  )
}


