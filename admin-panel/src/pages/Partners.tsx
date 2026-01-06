import React, { useEffect, useState } from 'react'
import { fetchPartners, createPartner, updatePartner, deletePartner, uploadPartnerImage,
  fetchPartnerProducts, createPartnerProduct, deletePartnerProduct, uploadPartnerProductImage, updatePartnerProduct } from '../api/client'
import ProductForm from '../components/ProductForm'
import PartnerProductsPanel from '../components/PartnerProductsPanel'
import PartnerForm from '../components/PartnerForm'
import ConfirmDialog from '../components/ConfirmDialog'

// CSS анимации
const styles = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .partner-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeIn 0.5s ease-out;
  }

  .partner-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .product-card {
    background: var(--white);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--gray-200);
    transition: all 0.2s ease;
  }

  .product-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`

// Создаем элемент style
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}

type Partner = {
  id: number | string
  name: string
  description?: string
  createdAt?: string
 imageUrl?: string
 price?: number
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Partner | null>(null)
  const [expandedPartnerIds, setExpandedPartnerIds] = useState<(string|number)[]>([])
  const [partnerProducts, setPartnerProducts] = useState<Record<string, any[]>>({})
  const [newProductDraft, setNewProductDraft] = useState<{ partnerId?: string | number, name?: string, description?: string, price?: string, sku?: string, stock?: string, category?: string, image?: File | null }>({})
  const [addingProductFor, setAddingProductFor,] = useState<string | number | null>(null)
  const [editingProduct, setEditingProduct] = useState<{ partnerId?: string | number, id?: string | number, name?: string, description?: string, price?: string | number, sku?: string, stock?: string | number, category?: string } | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchPartners()
      const list = Array.isArray(data) ? data : (data.items || data.data || [])
      setPartners(list)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load partners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleProductsFor = (partnerId: string | number) => {
    setExpandedPartnerIds((prev) => {
      const exists = prev.includes(partnerId)
      if (exists) {
        // collapse
        return prev.filter((id) => id !== partnerId)
      } else {
        // expand
        return [...prev, partnerId]
      }
    })
    if (!partnerProducts[partnerId]) {
      fetchPartnerProducts(partnerId).then((data) => {
        setPartnerProducts((prev) => ({ ...prev, [partnerId.toString()]: Array.isArray(data) ? data : data.items || data.data || [] }))
      }).catch(() => {})
    }
  }

  const handleCreate = () => {
    setCreating(true)
  }

  const handleEdit = (p: Partner) => {
    setEditing(p)
  }

  const handleDelete = (p: Partner) => {
    setDeleting(p)
  }

  const performDelete = async () => {
    if (!deleting) return
    try {
      await deletePartner(deleting.id)
      setPartners(prev => prev.filter(x => x.id !== deleting.id))
      setDeleting(null)
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления')
    }
  }

  // editingProduct state removed duplicate; using existing declaration above
  const handleSave = async (payload: any, imageFile?: File | null) => {
    try {
      if (payload.id) {
        const id = payload.id
        // Update partner's product if editing
        if (payload?.partnerId && payload?.id) {
          await updatePartnerProduct(payload.partnerId, payload.id, {
            name: payload.name,
            description: payload.description,
            price: payload.price,
            sku: payload.sku,
            stock: payload.stock,
            category: payload.category
          })
          if (imageFile) {
            await uploadPartnerProductImage(payload.partnerId, payload.id, imageFile)
          }
          // refresh list for this partner
          const data = await fetchPartnerProducts(payload.partnerId)
          if (Array.isArray(data)) {
            setPartnerProducts((prev) => ({ ...prev, [payload.partnerId]: data }))
          } else {
            setPartnerProducts((prev) => ({ ...prev, [payload.partnerId]: data.items || data.data || [] }))
          }
        } else {
          // existing partner/product path (fallback)
          await updatePartner(id, { name: payload.name, description: payload.description })
          if (imageFile) {
            await uploadPartnerImage(id, imageFile)
          }
        }
        setEditingProduct(null)
        await load()
    } else {
      if (payload.partnerId) {
        // Create a product under the partner
        const prodPayload = {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        }
        const created = await createPartnerProduct(payload.partnerId, prodPayload)
        const newId = created?.id || created?.data?.id
        if (imageFile && newId) {
          await uploadPartnerProductImage(payload.partnerId, newId, imageFile)
        }
        const data = await fetchPartnerProducts(payload.partnerId)
        setPartnerProducts((prev) => ({
          ...prev,
          [payload.partnerId]: Array.isArray(data) ? data : data.items || data.data || []
        }))
      } else {
        // Create a new partner
        const created = await createPartner({ name: payload.name, description: payload.description })
        const newId = created?.id || created?.data?.id
        if (imageFile && newId) {
          await uploadPartnerImage(newId, imageFile)
        }
      }
      await load()
      setCreating(false)
    }
    } catch (err: any) {
      throw err
    }
  }

  return (
    <div className="container">
      {/* Заголовок с кнопкой создания */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '20px',
        background: 'var(--gradient-primary)',
        borderRadius: '16px',
        color: 'var(--white)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🏪 Партнеры
          </h2>
          <p style={{
            margin: 0,
            opacity: 0.9,
            fontSize: '14px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            Управление партнерами и их товарами
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'var(--white)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          ➕ Новый партнер
        </button>
      </div>

      {/* Сообщения о состоянии */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--gray-600)',
          fontSize: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--gray-300)',
            borderTop: '3px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          Загрузка партнеров...
        </div>
      )}

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Ошибка загрузки</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{error}</div>
        </div>
      )}

      {!loading && partners.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--gray-500)',
          background: 'var(--white)',
          borderRadius: '16px',
          border: '2px dashed var(--gray-300)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🏪</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Нет партнеров</div>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>Партнеры еще не добавлены в систему</div>
          <button
            onClick={handleCreate}
            style={{
              padding: '12px 24px',
              background: 'var(--gradient-primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ➕ Добавить первого партнера
          </button>
        </div>
      )}

      {/* Сетка партнеров */}
      {!loading && partners.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {partners.map(p => (
            <div key={String(p.id)} className="partner-card" style={{
              background: 'var(--white)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* ID партнера в углу */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--gray-100)',
                color: 'var(--gray-600)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                fontFamily: 'monospace',
                border: '1px solid var(--gray-200)'
              }}>
                #{String(p.id).padStart(3, '0')}
              </div>

              {/* Основная информация */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--white)',
                  fontSize: '24px',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                }}>
                  🏪
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    color: 'var(--gray-900)',
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '4px',
                    lineHeight: '1.2'
                  }}>
                    {p.name}
                  </div>
                  {p.description && (
                    <div style={{
                      color: 'var(--gray-600)',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      {p.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Статистика товаров */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                background: 'var(--gray-50)',
                borderRadius: '12px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  background: 'var(--white)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--accent)',
                    marginBottom: '2px'
                  }}>
                    {partnerProducts[p.id]?.length || 0}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Товаров
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  background: 'var(--white)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#16a34a',
                    marginBottom: '2px'
                  }}>
                    Активен
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Статус
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => toggleProductsFor(p.id)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--gray-200)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gray-100)'
                  }}
                >
                  📦 {expandedPartnerIds.includes(p.id) ? 'Скрыть товары' : 'Показать товары'}
                </button>

                <button
                  onClick={() => handleEdit(p)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--accent)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  ✏️ Изменить
                </button>

                <button
                  onClick={() => handleDelete(p)}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.color = '#dc2626'
                    e.currentTarget.style.borderColor = '#fca5a5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gray-100)'
                    e.currentTarget.style.color = 'var(--gray-700)'
                    e.currentTarget.style.borderColor = 'var(--gray-300)'
                  }}
                >
                  🗑️
                </button>
              </div>

              {/* Секция товаров */}
              {expandedPartnerIds.includes(p.id) && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'var(--gray-50)',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-200)'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📦 Товары партнера
                  </h4>

                  {/* Форма добавления товара */}
                  <div style={{
                    background: 'var(--white)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid var(--gray-200)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <input
                        placeholder="Название товара"
                        value={newProductDraft.name || ''}
                        onChange={e => setNewProductDraft(d => ({ ...d, name: e.target.value, partnerId: p.id }))}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={async () => {
                          if (!newProductDraft.name) return
                          const payload = {
                            name: newProductDraft.name,
                            description: newProductDraft.description,
                            price: newProductDraft.price ? Number(newProductDraft.price) : undefined
                          }
                          try {
                            const created = await createPartnerProduct(p.id, {
                              ...payload,
                              sku: newProductDraft.sku,
                              stock: newProductDraft.stock ? Number(newProductDraft.stock) : undefined,
                              category: newProductDraft.category
                            })
                            const pid = created?.id
                            if (newProductDraft.image && pid != null) {
                              await uploadPartnerProductImage(p.id, pid, newProductDraft.image)
                            }
                            const data = await fetchPartnerProducts(p.id)
                            setPartnerProducts(prev => ({
                              ...prev,
                              [p.id]: Array.isArray(data) ? data : data.items || data.data || []
                            }))
                            setNewProductDraft({})
                          } catch (err) {
                            console.error('Error creating product:', err)
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--gradient-primary)',
                          color: 'var(--white)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ➕ Добавить
                      </button>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr auto',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <input
                        placeholder="Описание товара"
                        value={newProductDraft.description || ''}
                        onChange={e => setNewProductDraft(d => ({ ...d, description: e.target.value }))}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Цена"
                        value={newProductDraft.price || ''}
                        onChange={e => setNewProductDraft(d => ({ ...d, price: e.target.value }))}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0] || null
                          setNewProductDraft(d => ({ ...d, image: file || undefined }))
                        }}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Список товаров */}
                  <div className="products-grid">
                    {(partnerProducts[p.id] || []).map((product: any) => (
                      <div key={product.id} className="product-card">
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                            lineHeight: '1.3'
                          }}>
                            {product.name}
                          </div>
                          <button
                            onClick={() => setEditingProduct({
                              partnerId: p.id,
                              id: product.id,
                              name: product.name,
                              description: product.description,
                              price: product.price,
                              sku: product.sku,
                              stock: product.stock,
                              category: product.category
                            })}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--gray-100)',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✏️
                          </button>
                        </div>

                        {product.description && (
                          <div style={{
                            fontSize: '14px',
                            color: 'var(--gray-600)',
                            marginBottom: '8px',
                            lineHeight: '1.4'
                          }}>
                            {product.description}
                          </div>
                        )}

                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: 'var(--accent)',
                          marginBottom: '4px'
                        }}>
                          ${product.price || 0}
                        </div>

                        {product.stock !== undefined && (
                          <div style={{
                            fontSize: '12px',
                            color: product.stock > 0 ? '#16a34a' : '#dc2626'
                          }}>
                            {product.stock > 0 ? `✅ В наличии: ${product.stock}` : '❌ Нет в наличии'}
                          </div>
                        )}
                      </div>
                    ))}

                    {(partnerProducts[p.id] || []).length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--gray-500)',
                        background: 'var(--white)',
                        borderRadius: '8px',
                        border: '2px dashed var(--gray-300)'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                        <div style={{ fontSize: '14px' }}>У партнера пока нет товаров</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модальные окна */}
      {creating && <PartnerForm onCancel={() => setCreating(false)} onSave={handleSave} />}
      {editing && <PartnerForm initial={editing as any} onCancel={() => setEditing(null)} onSave={handleSave} />}
      {editingProduct && (
        <ProductForm
          initial={editingProduct}
          onCancel={() => setEditingProduct(null)}
          onSave={async (payload, image) => {
            const partnerId = editingProduct.partnerId
            if (!partnerId) return

            await updatePartnerProduct(partnerId, payload.id, {
              name: payload.name,
              description: payload.description,
              price: payload.price,
              sku: payload.sku,
              stock: payload.stock,
              category: payload.category
            })
            if (image) {
              await uploadPartnerProductImage(partnerId, payload.id, image)
            }
            const data = await fetchPartnerProducts(partnerId)
            setPartnerProducts((prev) => ({
              ...prev,
              [partnerId]: Array.isArray(data) ? data : data.items || data.data || []
            }))
            setEditingProduct(null)
          }}
        />
      )}
      {deleting && <ConfirmDialog title="Удалить партнера" message={`Удалить "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={performDelete} />}
    </div>
  )
}


