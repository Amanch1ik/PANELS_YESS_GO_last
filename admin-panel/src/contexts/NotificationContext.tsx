import React, { createContext, useContext, useMemo, useState } from 'react'

type ToastType = 'info' | 'success' | 'error'
type Toast = { id: string; title?: string; message?: string; type?: ToastType }

type NotificationContextValue = {
  toasts: Toast[]
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

function useUniqueId() {
  const [n, setN] = useState(0)
  const id = useMemo(() => `toast_${n}`, [n])
  const next = () => setN(n + 1)
  return () => { const id = `toast_${n + 1}`; setN(n + 1); return id; }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = (t: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    setToasts((prev) => [...prev, { id, ...t }])
    // auto dismiss after a while
    setTimeout(() => dismissToast(id), 5000)
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const value = { toasts, pushToast, dismissToast }
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return ctx
}


