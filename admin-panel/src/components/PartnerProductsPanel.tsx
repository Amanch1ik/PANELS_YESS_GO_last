import React, { useEffect, useState } from 'react'
import {
  fetchPartnerProducts,
  createPartnerProduct,
  updatePartnerProduct,
  deletePartnerProduct,
  uploadPartnerProductImage,
  clearPartnerProductsCache
} from '../api/client'
import ProductForm from './ProductForm'
import ConfirmDialog from './ConfirmDialog'

type PartnerProductsPanelProps = {
  partnerId: string | number
  partnerName?: string
  onError?: (msg: string) => void
}

type PartnerProduct = {
  id: string | number
  name: string
  description?: string
  price?: number
  sku?: string
  stock?: number
  category?: string
  imageUrl?: string
}

import SkeletonGrid from '../components/Skeleton'

export default function PartnerProductsPanel({ partnerId, partnerName, onError }: PartnerProductsPanelProps) {
  const [products, setProducts] = useState<PartnerProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<PartnerProduct | null>(null)
  const [deleting, setDeleting] = useState<PartnerProduct | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPartnerProducts(partnerId)
      setProducts(Array.isArray(data) ? data : (data.items || data.data || []))
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load products'
      setError(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  // Do not auto-load products to avoid mass requests — load on demand
  useEffect(() => {
    // reset products when partnerId changes but don't fetch automatically
    setProducts([])
    setError(null)
    setLoading(false)
  }, [partnerId])

  const handleLoadClick = () => {
    load()
  }

  const handleRefreshClick = async () => {
    try {
      // clear partner-specific cache and reload
      clearPartnerProductsCache && clearPartnerProductsCache(partnerId)
    } catch (e) {
      console.warn('Не удалось очистить кэш партнёра перед обновлением', e)
    }
    await load()
  }

  const handleSave = async (payload: any, imageFile?: File | null) => {
    try {
      if (payload.id) {
        const id = payload.id
        await updatePartnerProduct(partnerId, id, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        })
        if (imageFile) {
          await uploadPartnerProductImage(partnerId, id, imageFile)
        }
      } else {
        const created = await createPartnerProduct(partnerId, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        })
        const pid = created?.id
        if (imageFile && pid != null) {
          await uploadPartnerProductImage(partnerId, pid, imageFile)
        }
      }
      await load()
      setCreating(false)
      setEditing(null)
    } catch (err: any) {
      onError?.(err?.message || 'Product save failed')
      throw err
    }
  }

  const handleDelete = (p: PartnerProduct) => {
    setDeleting(p)
  }

  const performDelete = async () => {
    if (!deleting) return
    try {
      await deletePartnerProduct(partnerId, deleting.id)
      setProducts(prev => prev.filter(x => x.id !== deleting.id))
      setDeleting(null)
    } catch (err: any) {
      onError?.(err?.message || 'Ошибка удаления')
    }
  }

  return (
    <div className="card" style={{ padding: 8, marginTop: 8 }}>
      {loading && <div style={{ padding: 8 }}><SkeletonGrid count={3} columns={1} /></div>}
      {error && <div style={{ color: '#ff7b7b' }}>{error}</div>}
      {!loading && products.length === 0 && <div className="muted" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Нет товаров для этого партнера</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ color: 'var(--gray-900)', textShadow: 'none' }}>Партнер {partnerName ?? partnerId}</strong>
        <button className="button" onClick={() => setCreating(true)}>Новый товар</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(!loading && products.length === 0) && <button className="button" onClick={handleLoadClick}>Загрузить товары</button>}
        <button className="button" onClick={handleRefreshClick}>Обновить товары</button>
      </div>
      {creating && (
        <ProductForm onCancel={() => setCreating(false)} onSave={handleSave} initial={{}} />
      )}
      {editing && (
        <ProductForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
      {deleting && (
        <ConfirmDialog title="Удалить товар" message={`Удалить "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={performDelete} />
      )}
      <div>
        {products.map((pp) => (
          <div key={pp.id} style={{ padding: 8, borderBottom: '1px solid rgba(0,0,0,.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{pp.name}</strong>
                <div className="muted" style={{ fontSize: 12 }}>{pp.description}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="button" onClick={() => setEditing(pp)}>Изменить</button>
                <button className="button" onClick={() => handleDelete(pp)} style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }}>Удалить</button>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>${pp.price ?? ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


