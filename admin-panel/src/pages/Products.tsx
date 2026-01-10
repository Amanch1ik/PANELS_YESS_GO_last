import React, { useEffect, useState, useCallback } from 'react'
import { fetchProducts, fetchPartners, fetchPartnerProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../api/client'
import { FixedSizeList as VirtualList } from 'react-window'
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
  category?: string
  categoryId?: number
  isAvailable?: boolean
  isActive?: boolean
  stock?: number
  sortOrder?: number
}

export default function Products({ onError }: { onError?: (msg: string) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerFetchLimit, setPartnerFetchLimit] = useState(20)
  const [isAggregated, setIsAggregated] = useState(false)
  const [partnersAvailableCount, setPartnersAvailableCount] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchProducts()

      // Handle different response formats
      let productsList: Product[] = []
      if (Array.isArray(data)) {
        productsList = data as Product[]
      } else if (data && typeof data === 'object') {
        productsList = (data.items || data.data || data.products || []) as Product[]
      }
      // If no global products, try to collect products from partners (best-effort)
      if ((!productsList || productsList.length === 0)) {
        try {
          const partnersResp = await fetchPartners()
          const partnersList: any[] = Array.isArray(partnersResp) ? partnersResp : (partnersResp?.items || partnersResp?.data || [])
          if (Array.isArray(partnersList) && partnersList.length > 0) {
            // mark aggregated mode and record available partners
            setIsAggregated(true)
            setPartnersAvailableCount(partnersList.length)
            // limit partners queried by partnerFetchLimit to avoid huge loads
            const partnerIds = partnersList.slice(0, partnerFetchLimit).map(p => p.id || p._id || p.partner_id).filter(Boolean)
            const batchSize = 6
            const collected: Product[] = []
            for (let i = 0; i < partnerIds.length; i += batchSize) {
              const batch = partnerIds.slice(i, i + batchSize)
              const settled = await Promise.allSettled(batch.map(id => fetchPartnerProducts(id)))
              settled.forEach(r => {
                if (r.status === 'fulfilled' && r.value) {
                  const arr = Array.isArray(r.value) ? r.value : (r.value.items || r.value.data || [])
                  if (Array.isArray(arr)) {
                    arr.forEach((it: any) => {
                      // normalize common fields
                      collected.push({
                        id: it.id ?? it._id ?? `${it.partner_id || 'p'}-${it.id || Math.random()}`,
                        name: it.name || it.title || 'Без названия',
                        description: it.description || it.desc || '',
                        price: it.price ?? it.cost ?? undefined,
                        imageUrl: it.image || it.imageUrl || it.images?.[0] || undefined,
                        category: it.category || it.categoryName || undefined,
                        categoryId: it.categoryId ?? undefined,
                        isAvailable: it.isAvailable ?? it.available ?? it.is_active ?? undefined,
                        isActive: it.is_active ?? undefined,
                        stock: it.stock ?? it.qty ?? undefined,
                        sortOrder: it.sortOrder ?? undefined
                      } as Product)
                    })
                  }
                }
              })
              // small pause to reduce 429 risk
              await new Promise(res => setTimeout(res, 150))
            }
            // dedupe by id
            const map = new Map<string | number, Product>()
            collected.forEach(p => map.set(String(p.id), p))
            productsList = Array.from(map.values())
          }
        } catch (e) {
          // ignore partner-collection errors; we'll show empty state below
        }
      }

      setProducts(productsList)
    } catch (err: any) {
      console.error('❌ Error loading products:', err)
      const msg = err?.response?.data?.message || err?.message || 'Не удалось загрузить товары'
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="button"
            onClick={load}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            🔄 Обновить
          </button>
          <button className="button" onClick={() => setCreating(true)}>Новый продукт</button>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Фильтр по категориям:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--gray-300)',
              borderRadius: '4px',
              backgroundColor: 'white',
              minWidth: '200px'
            }}
          >
            <option value="all">Все категории ({products.length})</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category} ({products.filter(p => p.category === category).length})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="card">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <div className="muted">Загрузка товаров...</div>
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ff7b7b' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
            <div style={{ marginBottom: '16px' }}>Ошибка загрузки товаров</div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px' }}>{error}</div>
            <button className="button" onClick={load} style={{ background: 'var(--primary)' }}>
              🔄 Попробовать снова
            </button>
          </div>
        )}
        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📦</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Нет товаров
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>
              В базе данных пока нет товаров. Добавьте первый товар.
            </div>
          </div>
        )}
        {!loading && products.length > 0 && filteredProducts.length === 0 && (
          <div className="muted">В выбранной категории нет продуктов</div>
        )}
        {!loading && filteredProducts.length > 0 && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--gray-600)' }}>
              Показано {filteredProducts.length} из {products.length} продуктов
            </div>
            <div style={{ height: Math.min(600, filteredProducts.length * 84), width: '100%' }}>
              <VirtualList
                height={Math.min(600, filteredProducts.length * 84)}
                itemCount={filteredProducts.length}
                itemSize={84}
                width="100%"
              >
                {({ index, style }) => {
                  const p = filteredProducts[index]
                  return (
                    <div key={String(p.id)} style={{ ...style, padding: 12, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: 16 }}>{p.name}</strong>
                          {p.category && (
                            <span style={{
                              background: 'var(--primary)',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              {p.category}
                            </span>
                          )}
                        </div>
                        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{p.description}</div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                          {p.price !== undefined && p.price !== null && (
                            <span className="muted">{Number(p.price).toLocaleString()} сом</span>
                          )}
                          {p.stock !== undefined && <span className="muted">Запас: {p.stock}</span>}
                          {p.isAvailable !== undefined && (
                            <span style={{
                              color: p.isAvailable ? '#10b981' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {p.isAvailable ? 'Доступен' : 'Недоступен'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="button" onClick={() => handleEdit(p)}>Изменить</button>
                        <button className="button" onClick={() => handleDelete(p)} style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }}>Удалить</button>
                      </div>
                    </div>
                  )
                }}
              </VirtualList>
            </div>
            {isAggregated && partnersAvailableCount && partnerFetchLimit < partnersAvailableCount && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  className="button"
                  onClick={async () => {
                    setPartnerFetchLimit(prev => Math.min((partnersAvailableCount || prev), prev + 20))
                    await load()
                  }}
                >
                  Показать ещё партнёров ({partnerFetchLimit}/{partnersAvailableCount})
                </button>
              </div>
            )}
          </div>
        )}
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


