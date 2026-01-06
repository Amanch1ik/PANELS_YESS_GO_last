import React, { createContext, useContext, useMemo, useState } from 'react'

type Role = 'admin' | 'editor' | 'viewer'

type RBACContextValue = {
  role: Role
  setRole: (r: Role) => void
  canAccess: (perm: string) => boolean
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined)

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('admin')

  const canAccess = (perm: string) => {
    if (role === 'admin') return true
    if (role === 'editor') {
      return perm !== 'manage_users' && perm !== 'view_audit_logs'
    }
    // viewer
    return perm === 'view_partners' || perm === 'view_products' || perm === 'view_messages'
  }

  const value = useMemo(() => ({ role, setRole, canAccess }), [role])
  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

export function useRBAC() {
  const ctx = useContext(RBACContext)
  if (!ctx) throw new Error('useRBAC must be used within an RBACProvider')
  return ctx
}


