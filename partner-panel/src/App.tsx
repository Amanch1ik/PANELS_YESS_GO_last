import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { getStoredPartnerToken } from './api/client'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'

// CSS Variables and base styles (aligned with admin panel design)
const globalStyles = `
:root {
  --bg: #ffffff;
  --card: #f8fafc;
  --muted: #64748b;
  --accent: #07B981;
  --accent-light: #34d399;
  --accent-dark: #065f46;
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --gradient-primary: linear-gradient(135deg, #07B981 0%, #34d399 100%);
  --gradient-secondary: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  --gradient-bg: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background: var(--gradient-bg);
  color: var(--gray-800);
  line-height: 1.6;
}
.container {
  max-width: 1200px;
  margin: 32px auto;
  padding: 24px;
}
.card {
  background: var(--white);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--gray-200);
  transition: all 0.3s ease;
}
.button {
  background: var(--gradient-primary);
  color: var(--white);
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(3, 83, 58, 0.4);
}
input, textarea, select {
  background: var(--white);
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  padding: 12px 16px;
  color: var(--gray-800);
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}
input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(7, 185, 129, 0.15);
  background: var(--gray-50);
}
h1, h2, h3, h4, h5, h6 {
  color: var(--gray-900);
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.3;
}
`

// Navigation component
function Navigation({ activeTab, onTabChange, onLogout }: {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
}) {
  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: '📊' },
    { id: 'products', label: 'Товары', icon: '📦' },
    { id: 'customers', label: 'Клиенты', icon: '👥' }
  ]

  return (
    <nav style={{
      background: 'var(--white)',
      borderBottom: '1px solid var(--gray-200)',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        {/* Logo */}
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--gray-900)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🏪 YESS!GO Partner
        </div>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === item.id ? 'var(--blue-500)' : 'transparent',
                color: activeTab === item.id ? 'var(--white)' : 'var(--gray-700)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: 'var(--red-50)',
            color: 'var(--red-700)',
            border: '1px solid var(--red-200)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = 'var(--red-100)'
            ;(e.target as HTMLElement).style.borderColor = 'var(--red-300)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'var(--red-50)'
            ;(e.target as HTMLElement).style.borderColor = 'var(--red-200)'
          }}
        >
          🚪 Выйти
        </button>
      </div>
    </nav>
  )
}

// Main App Component
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const token = getStoredPartnerToken()
    if (token) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('partner_access_token')
    localStorage.removeItem('partner_refresh_token')
    setIsAuthenticated(false)
    setActiveTab('dashboard')
  }

  const handleError = (message: string) => {
    // Simple error handling - in real app you'd use a toast library
    alert(message)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: 'var(--gray-600)'
      }}>
        Загрузка...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <Dashboard onError={handleError} />}
        {activeTab === 'products' && <Products onError={handleError} />}
        {activeTab === 'customers' && <Customers onError={handleError} />}
      </main>
    </div>
  )
}

function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  )
}

export default App