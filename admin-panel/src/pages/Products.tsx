import React, { useEffect, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../api/client'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'

// CSS анимации
const styles = ``

// Создаем элемент style
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}

type Product = {
  id: string | number
  name: string
  description?: string
  price?: number
  imageUrl?: string
}

export default function Products({ onError }: { onError?: (msg: string) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to fetch first page and detect pagination metadata
      const first = await fetchProducts({ page: 1, limit: 100 })
      // Handle array response
      if (Array.isArray(first)) {
        setProducts(first)
      } else {
        const items = first.items || first.data || []
        const total = first.total || first.count || null
        const perPage = first.per_page || first.pageSize || first.limit ||  (Array.isArray(items) ? items.length : 0)
        if (total && perPage && total > items.length) {
          // fetch remaining pages
          const pages = Math.ceil(total / perPage)
          const allItems = [...items]
          for (let p = 2; p <= pages; p++) {
            try {
              const pageResp = await fetchProducts({ page: p, limit: perPage })
              const pageItems = pageResp.items || pageResp.data || []
              if (Array.isArray(pageItems) && pageItems.length > 0) {
                allItems.push(...pageItems)
              }
            } catch (err) {
              // stop fetching further pages on error
              console.warn('Failed to fetch products page', p, err)
              break
            }
          }
          setProducts(allItems)
        } else {
          setProducts(items)
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load products'
      setError(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (payload: any, imageFile?: File | null) => {
    try {
      if (payload.id) {
        const id = payload.id
        await updateProduct(id, { name: payload.name, description: payload.description, price: payload.price })
        if (imageFile) {
          await uploadProductImage(id, imageFile)
        }
      } else {
        const created = await createProduct({ name: payload.name, description: payload.description, price: payload.price })
        const newId = created?.id
        if (imageFile && newId != null) {
          await uploadProductImage(newId, imageFile)
        }
      }
      await load()
      setCreating(false)
      setEditing(null)
      setDeleting(null)
    } catch (err: any) {
      throw err
    }
  }
  const handleEdit = (p: Product) => {
    setEditing(p)
  }
  const handleDelete = (p: Product) => {
    setDeleting(p)
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteProduct(deleting.id).then(() => {
      setDeleting(null)
      load()
    }).catch((err: any) => {
      setDeleting(null)
      onError?.(err?.message || 'Ошибка удаления')
    })
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: '24px' }}>
          Продукты
        </h2>
        <button className="button" onClick={() => setCreating(true)}>Новый продукт</button>
      </div>
      <div className="card">
        {loading && <div className="muted">Loading...</div>}
        {error && <div style={{ color: '#ff7b7b' }}>{error}</div>}
        {!loading && products.length === 0 && <div className="muted">No products</div>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {products.map(p => (
            <li key={String(p.id)} style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{p.name}</strong>
                <div className="muted" style={{ fontSize: 13 }}>{p.description}</div>
                <div className="muted" style={{ fontSize: 12 }}>{p.price ? `$${p.price}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="button" onClick={() => handleEdit(p)}>Изменить</button>
                <button className="button" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }}>Удалить</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {creating && (
        <ProductForm
          onCancel={() => setCreating(false)}
          onSave={handleSave}
        />
      )}
      {editing && (
        <ProductForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Удалить продукт"
          message={`Удалить "${deleting.name}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}


