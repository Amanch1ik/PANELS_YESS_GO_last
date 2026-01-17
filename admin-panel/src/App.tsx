import React, { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { setAuthToken, hasValidTokens, hydrateCacheFromLocalStorage } from './api/client'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
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
const MapPage = lazy(() => import('./pages/Map'))

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

// Lightweight app shell shown while routes lazy-load — improves perceived load time
const AppShell = () => (
  <div>
    <header style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', boxShadow: 'var(--shadow-md)', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--gray-200)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '24px', color: 'var(--accent)' }}>
        <img src="/favicon.svg" alt="logo" style={{ width: 32, height: 32 }} />
        YESS!GO Админ
      </div>
      <nav style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 90, height: 36, background: 'var(--gray-100)', borderRadius: 8 }} />
        <div style={{ width: 90, height: 36, background: 'var(--gray-100)', borderRadius: 8 }} />
        <div style={{ width: 90, height: 36, background: 'var(--gray-100)', borderRadius: 8 }} />
      </nav>
    </header>

    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ background: 'var(--white)', borderRadius: 12, padding: 20, minHeight: 100, border: '1px solid var(--gray-200)' }}>
          <div style={{ width: '60%', height: 18, background: 'var(--gray-100)', borderRadius: 6, marginBottom: 12 }} />
          <div style={{ width: '40%', height: 12, background: 'var(--gray-100)', borderRadius: 6 }} />
        </div>
      ))}
    </main>
  </div>
)

// Hook for responsive design
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

type Theme = 'light' | 'dark' | 'auto'

// Компонент переключения темы для десктопа
function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Светлая', icon: '☀️' },
    { value: 'dark', label: 'Темная', icon: '🌙' },
    { value: 'auto', label: 'Авто', icon: '🔄' }
  ]

  const currentIcon = effectiveTheme === 'dark' ? '🌙' : '☀️'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="button"
        aria-label="Переключить тему"
        style={{
          background: 'var(--gray-100)',
          color: 'var(--gray-700)',
          border: '1px solid var(--gray-300)',
          padding: '8px 12px',
          fontSize: '18px',
          minWidth: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-base)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--gray-200)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--gray-100)'
        }}
      >
        {currentIcon}
      </button>

      {showMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998
            }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--white)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--gray-200)',
              padding: '8px',
              minWidth: '140px',
              zIndex: 9999,
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value)
                  setShowMenu(false)
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme === t.value ? 'var(--gray-100)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--gray-800)',
                  fontSize: '14px',
                  fontWeight: theme === t.value ? 600 : 400,
                  transition: 'all var(--transition-base)',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (theme !== t.value) {
                    e.currentTarget.style.background = 'var(--gray-50)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== t.value) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{t.icon}</span>
                <span>{t.label}</span>
                {theme === t.value && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Компонент выбора темы для мобильного меню
function MobileThemeSelector({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme()

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Светлая', icon: '☀️' },
    { value: 'dark', label: 'Темная', icon: '🌙' },
    { value: 'auto', label: 'Авто', icon: '🔄' }
  ]

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-200)', marginTop: '8px' }}>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600 }}>
        ТЕМА
      </div>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => {
            setTheme(t.value)
            onClose()
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: theme === t.value ? 'var(--gray-100)' : 'transparent',
            border: '1px solid var(--gray-300)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--gray-700)',
            fontSize: '14px',
            marginBottom: '6px',
            transition: 'all var(--transition-base)',
            fontWeight: theme === t.value ? 600 : 400
          }}
        >
          <span style={{ fontSize: '18px' }}>{t.icon}</span>
          <span>{t.label}</span>
          {theme === t.value && (
            <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>
          )}
        </button>
      ))}
    </div>
  )
}

// Компонент навигации
function Navigation() {
  const location = useLocation()
  const currentPath = location.pathname
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Hide navigation bar on the login page
  if (currentPath === '/login') return null
  
  useEffect(() => {
    // Preload критически важных компонентов
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Предварительная загрузка основных страниц
        import('./pages/Partners')
        import('./pages/Users')
      })
    }
  }, [])

  const isActive = (path: string) => currentPath === path || (path === '/home' && currentPath === '/')
  
  const navItems = [
    { path: '/home', label: '🏠 Главная', icon: '🏠' },
    { path: '/partners', label: 'Партнеры', icon: '🏪' },
    { path: '/map', label: 'Карта', icon: '🗺️' },
    { path: '/products', label: 'Продукты', icon: '📦' },
    { path: '/transactions', label: 'Транзакции', icon: '💳' },
    { path: '/messages', label: 'Сообщения', icon: '💬' },
    { path: '/users', label: 'Пользователи', icon: '👥' }
  ]

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const pathMap: Record<string, string> = {
      '/home': 'Главная',
      '/partners': 'Партнеры',
      '/map': 'Карта',
      '/products': 'Продукты',
      '/transactions': 'Транзакции',
      '/messages': 'Сообщения',
      '/users': 'Пользователи'
    }
    const current = pathMap[currentPath] || 'Главная'
    return [{ label: 'Главная', path: '/home' }, { label: current, path: currentPath }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <>
      <header style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'var(--white)', 
        boxShadow: 'var(--shadow-md)', 
        borderRadius: '16px', 
        marginBottom: '24px', 
        border: '1px solid var(--gray-200)',
        position: 'sticky',
        top: '16px',
        zIndex: 100,
        transition: 'all var(--transition-base)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: isMobile ? '20px' : '24px', color: 'var(--accent)', textShadow: 'none' }}>
          <img
            src="/favicon.svg"
            alt="YESS!GO Logo"
            style={{ width: '32px', height: '32px' }}
          />
          {!isMobile && <span>YESS!GO Админ</span>}
        </div>
        
        {/* Desktop Navigation */}
        <nav style={{ display: isMobile ? 'none' : 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <button 
                className="button" 
                aria-label={item.label}
                style={{
                  background: isActive(item.path) ? 'var(--accent)' : 'var(--gray-100)',
                  color: isActive(item.path) ? 'var(--white)' : 'var(--gray-700)',
                  border: isActive(item.path) ? 'none' : '1px solid var(--gray-300)',
                  padding: '8px 12px',
                  fontSize: '14px',
                  transition: 'all var(--transition-base)'
                }}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <ThemeToggle />
          <button 
            className="button" 
            onClick={() => { setAuthToken(null); window.location.href = '/' }} 
            style={{
              background: '#dc2626',
              color: 'var(--white)',
              border: 'none',
              padding: '8px 12px',
              fontSize: '14px'
            }}
            aria-label="Выйти из системы"
          >
            Выйти
          </button>
        </nav>

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Меню"
            aria-expanded={mobileMenuOpen}
          >
            <span style={{ width: '24px', height: '2px', background: 'var(--gray-700)', borderRadius: '2px', transition: 'all var(--transition-base)', transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }}></span>
            <span style={{ width: '24px', height: '2px', background: 'var(--gray-700)', borderRadius: '2px', transition: 'all var(--transition-base)', opacity: mobileMenuOpen ? 0 : 1 }}></span>
            <span style={{ width: '24px', height: '2px', background: 'var(--gray-700)', borderRadius: '2px', transition: 'all var(--transition-base)', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }}></span>
          </button>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {isMobile && mobileMenuOpen && (
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)',
          animation: 'slideInDown 0.3s ease-out'
        }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
              <button 
                className="button" 
                style={{
                  width: '100%',
                  background: isActive(item.path) ? 'var(--accent)' : 'var(--gray-100)',
                  color: isActive(item.path) ? 'var(--white)' : 'var(--gray-700)',
                  border: isActive(item.path) ? 'none' : '1px solid var(--gray-300)',
                  padding: '12px 16px',
                  textAlign: 'left',
                  justifyContent: 'flex-start'
                }}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <MobileThemeSelector onClose={() => setMobileMenuOpen(false)} />
          <button 
            className="button" 
            onClick={() => { setAuthToken(null); window.location.href = '/' }} 
            style={{
              width: '100%',
              background: '#dc2626',
              color: 'var(--white)',
              border: 'none',
              padding: '12px 16px',
              marginTop: '8px'
            }}
          >
            Выйти
          </button>
        </nav>
      )}

      {/* Breadcrumbs */}
      {currentPath !== '/home' && currentPath !== '/' && (
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          color: 'var(--gray-600)',
          flexWrap: 'wrap'
        }} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <span style={{ color: 'var(--gray-400)' }}>→</span>}
              <Link 
                to={crumb.path} 
                style={{ 
                  color: index === breadcrumbs.length - 1 ? 'var(--gray-900)' : 'var(--gray-600)',
                  textDecoration: 'none',
                  fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                  transition: 'color var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  if (index < breadcrumbs.length - 1) {
                    e.currentTarget.style.color = 'var(--accent)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (index < breadcrumbs.length - 1) {
                    e.currentTarget.style.color = 'var(--gray-600)'
                  }
                }}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      )}
    </>
  )
}

// Основное приложение с маршрутизацией
function AppContent({ onLogin }: { onLogin?: () => void }) {
  const [globalError, setGlobalError] = useState<string | null>(null)
  const location = useLocation()
  const onError = (msg: string) => setGlobalError(msg)

  // Проверяем токен при каждом изменении маршрута
  useEffect(() => {
    console.log(`📍 Route changed to ${location.pathname}, validating tokens...`)
    // Hydrate api client cache from localStorage so pages can render instantly with cached data
    try {
      hydrateCacheFromLocalStorage()
    } catch (e) {
      // no-op
    }
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

      <Suspense fallback={<AppShell />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login onLogin={onLogin || (() => {})} onError={onError} />} />
          <Route path="/home" element={<Home onError={onError} />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:id" element={<PartnerDetail onError={onError} />} />
          <Route path="/map" element={<MapPage onError={onError} />} />
          <Route path="/products" element={<Products onError={onError} />} />
          <Route path="/transactions" element={<Transactions onError={onError} />} />
          <Route path="/messages" element={<Messages onError={onError} />} />
          <Route path="/users" element={<Users onError={onError} />} />
          {/* Non-essential routes removed */}
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
      <ThemeProvider>
        <NotificationProvider>
          <Notifications />
          <Login onLogin={() => setAuthenticated(true)} onError={onError} />
        </NotificationProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <Notifications />
        <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent onLogin={() => setAuthenticated(true)} />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  )
}


