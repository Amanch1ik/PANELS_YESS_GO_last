import React from 'react'
import { RBACProvider, useRBAC } from '../contexts/RBACContext'

export default function RBACPage() {
  return (
    <RBACProvider>
      <RBACInner />
    </RBACProvider>
  )
}

function RBACInner() {
  const { role, setRole, canAccess } = useRBAC()
  const roles: Array<'admin'|'editor'|'viewer'> = ['admin','editor','viewer']
  return (
    <div className="container">
      <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: '24px' }}>Права доступа (Демо)</h2>
      <div className="card" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: 'var(--accent-light)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Текущая роль:</label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} style={{ marginLeft: 8, padding: 6, background: 'rgba(7, 185, 129, 0.1)', border: '1px solid rgba(7, 185, 129, 0.3)', borderRadius: '6px', color: 'var(--white)' }}>
            {roles.map(r => <option key={r} value={r}>{r === 'admin' ? 'Администратор' : r === 'editor' ? 'Редактор' : 'Наблюдатель'}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <RoleChip label="Партнеры" perm="manage_partners" can={canAccess('manage_partners')} />
          <RoleChip label="Продукты" perm="manage_products" can={canAccess('manage_products')} />
          <RoleChip label="Сообщения" perm="manage_messages" can={canAccess('manage_messages')} />
          <RoleChip label="Пользователи" perm="manage_users" can={canAccess('manage_users')} />
          <RoleChip label="Аудит логи" perm="view_audit_logs" can={canAccess('view_audit_logs')} />
        </div>
      </div>
    </div>
  )
}

function RoleChip({ label, perm, can }: { label: string; perm: string; can: boolean }) {
  return (
    <div style={{
      padding: '6px 12px',
      borderRadius: 6,
      background: can ? '#10b981' : '#374151',
      color: '#fff'
    }}>
      {label} • {can ? '(разрешено)' : '(запрещено)'}
    </div>
  )
}


