import React from 'react'
import { refundTransaction, disputeTransaction } from '../api/client'
import { useNotification } from '../contexts/NotificationContext'

export default function TransactionDetailModal({ tx, onClose, onUpdated }: {
  tx: any
  onClose: () => void
  onUpdated?: () => void
}) {
  const { pushToast } = useNotification()

  const handleRefund = async () => {
    try {
      const result = await refundTransaction(tx.id)
      if (result.error === 'not_supported') {
        pushToast({ type: 'warning', title: 'Не поддерживается', message: result.message })
        return
      }
      pushToast({ type: 'success', title: 'Возврат', message: `Транзакция ${tx.id} помечена как возвращённая` })
      onUpdated?.()
      onClose()
    } catch (err: any) {
      pushToast({ type: 'error', title: 'Ошибка', message: err?.message || 'Не удалось выполнить возврат' })
    }
  }

  const handleDispute = async () => {
    try {
      const result = await disputeTransaction(tx.id)
      if (result.error === 'not_supported') {
        pushToast({ type: 'warning', title: 'Не поддерживается', message: result.message })
        return
      }
      pushToast({ type: 'success', title: 'Спор', message: `Транзакция ${tx.id} помечена как спорная` })
      onUpdated?.()
      onClose()
    } catch (err: any) {
      pushToast({ type: 'error', title: 'Ошибка', message: err?.message || 'Не удалось пометить спор' })
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ width: 720, maxHeight: '80vh', overflow: 'auto', background: 'var(--white)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{`Транзакция ${tx.id}`}</h3>
          <button className="button" onClick={onClose}>Закрыть</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Дата</div>
            <div style={{ fontWeight: 600 }}>{tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}</div>

            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Пользователь</div>
            <div>{tx.user?.name || tx.user?.email || tx.user || '-'}</div>

            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Тип</div>
            <div>{tx.type}</div>

            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Сумма</div>
            <div>{tx.amount} {tx.currency}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Статус</div>
            <div style={{ fontWeight: 600 }}>{tx.status}</div>

            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Reference</div>
            <div>{tx.reference || '-'}</div>

            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Метод</div>
            <div>{tx.method || '-'}</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Детали</div>
          <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8, maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(tx, null, 2)}</pre>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="button" onClick={handleDispute} style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: 'white' }}>Отметить спорным</button>
          <button className="button" onClick={handleRefund} style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: 'white' }}>Возврат</button>
        </div>
      </div>
    </div>
  )
}



