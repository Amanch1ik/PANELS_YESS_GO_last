import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Partners from './pages/Partners'
import Messages from './pages/Messages'
import Users from './pages/Users'
import Products from './pages/Products'
import { setAuthToken } from './api/client'
import { NotificationProvider } from './contexts/NotificationContext'
import Notifications from './components/Notifications'
import RBACPage from './pages/RBAC'
import AuditLogs from './pages/AuditLogs'

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<string>('partners')
  const [globalError, setGlobalError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('yessgo_token')
    if (token) {
      setAuthToken(token)
      setAuthenticated(true)
    }
  }, [])

  const onError = (msg: string) => setGlobalError(msg)

  if (!authenticated) {
    return (
      <NotificationProvider>
        <Notifications />
        <div>
          <Login onLogin={() => setAuthenticated(true)} onError={onError} />
        </div>
      </NotificationProvider>
    )
  }

  return (
    <NotificationProvider>
      <Notifications />
      <div>
        {globalError && (
          <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: '#fff', padding: 8, textAlign: 'center', borderRadius: '8px' }}>
            {globalError}
            <button className="button" style={{ marginLeft: 12 }} onClick={() => setGlobalError(null)}>Dismiss</button>
          </div>
        )}
      <header style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', boxShadow: 'var(--shadow-md)', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--gray-200)' }}>
        <div style={{ fontWeight: 700, fontSize: '24px', color: 'var(--accent)', textShadow: 'none' }}>YESSGO Админ</div>
        <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="button" onClick={() => setCurrentPage('partners')} style={{
              background: currentPage === 'partners' ? 'var(--accent)' : 'var(--gray-100)',
              color: currentPage === 'partners' ? 'var(--white)' : 'var(--gray-700)',
              border: currentPage === 'partners' ? 'none' : '1px solid var(--gray-300)'
            }}>Партнеры</button>
            <button className="button" onClick={() => setCurrentPage('products')} style={{
              background: currentPage === 'products' ? 'var(--accent)' : 'var(--gray-100)',
              color: currentPage === 'products' ? 'var(--white)' : 'var(--gray-700)',
              border: currentPage === 'products' ? 'none' : '1px solid var(--gray-300)'
            }}>Продукты</button>
            <button className="button" onClick={() => setCurrentPage('messages')} style={{
              background: currentPage === 'messages' ? 'var(--accent)' : 'var(--gray-100)',
              color: currentPage === 'messages' ? 'var(--white)' : 'var(--gray-700)',
              border: currentPage === 'messages' ? 'none' : '1px solid var(--gray-300)'
            }}>Сообщения</button>
            <button className="button" onClick={() => setCurrentPage('users')} style={{
              background: currentPage === 'users' ? 'var(--accent)' : 'var(--gray-100)',
              color: currentPage === 'users' ? 'var(--white)' : 'var(--gray-700)',
              border: currentPage === 'users' ? 'none' : '1px solid var(--gray-300)'
            }}>Пользователи</button>
            <button className="button" onClick={() => setCurrentPage('rbac')} style={{
              background: currentPage === 'rbac' ? 'var(--accent)' : 'var(--gray-100)',
              color: currentPage === 'rbac' ? 'var(--white)' : 'var(--gray-700)',
              border: currentPage === 'rbac' ? 'none' : '1px solid var(--gray-300)'
            }}>Права</button>
            <button className="button" onClick={() => setCurrentPage('audit')} style={{
              background: currentPage === 'audit' ? 'var(--accent)' : 'var(--gray-100)',
              color: currentPage === 'audit' ? 'var(--white)' : 'var(--gray-700)',
              border: currentPage === 'audit' ? 'none' : '1px solid var(--gray-300)'
            }}>Аудит</button>
            <button className="button" onClick={() => { setAuthToken(null); window.location.reload() }} style={{
              background: '#dc2626',
              color: 'var(--white)',
              border: 'none'
            }}>Выйти</button>
          </nav>
        </header>
        <main>
        {currentPage === 'partners' && <Partners onError={onError} />}
        {currentPage === 'products' && <Products onError={onError} />}
        {currentPage === 'messages' && <Messages onError={onError} />}
        {currentPage === 'users' && <Users onError={onError} />}
        {currentPage === 'rbac' && <RBACPage />}
        {currentPage === 'audit' && <AuditLogs />}
        </main>
      </div>
    </NotificationProvider>
  )
}


