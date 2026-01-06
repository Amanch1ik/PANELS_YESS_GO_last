import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPartners, fetchPartnerProducts, createPartnerProduct, updatePartnerProduct, deletePartnerProduct, uploadPartnerProductImage } from '../api/client'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'

// CSS анимации
const styles = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideInRight {
    0% { opacity: 0; transform: translateX(30px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  .partner-detail-card {
    animation: fadeIn 0.6s ease-out;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .product-card-detail {
    background: var(--white);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    animation: slideInRight 0.5s ease-out;
  }

  .product-card-detail:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin: 20px 0;
  }

  .stat-item {
    background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    border: 1px solid var(--gray-200);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    color: var(--gray-600);
  }

  .breadcrumb:hover {
    color: var(--accent);
    cursor: pointer;
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

type Product = {
  id: number | string
  name: string
  description?: string
  price?: number
  sku?: string
  stock?: number
  category?: string
  imageUrl?: string
  createdAt?: string
}

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate('/partners')
      return
    }
    loadPartnerData()
  }, [id, navigate])

  const loadPartnerData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Загружаем информацию о партнере
      const partnersData = await fetchPartners()
      const partnersList = Array.isArray(partnersData) ? partnersData : (partnersData.items || partnersData.data || [])
      const currentPartner = partnersList.find((p: any) => String(p.id) === id)

      if (!currentPartner) {
        setError('Партнер не найден')
        return
      }

      setPartner(currentPartner)

      // Загружаем товары партнера
      try {
        const productsData = await fetchPartnerProducts(id)
        const productsList = Array.isArray(productsData) ? productsData : (productsData.items || productsData.data || [])
        setProducts(productsList)
      } catch (productsError) {
        console.warn('Ошибка загрузки товаров партнера:', productsError)
        setProducts([])
      }

    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product)
  }

  const confirmDeleteProduct = async () => {
    if (!deletingProduct || !id) return

    try {
      await deletePartnerProduct(id, deletingProduct.id)
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id))
      setDeletingProduct(null)
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления товара')
    }
  }

  const handleSaveProduct = async (payload: any, imageFile?: File) => {
    if (!id) return

    try {
      if (editingProduct) {
        // Обновление существующего товара
        await updatePartnerProduct(id, editingProduct.id, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        })

        if (imageFile) {
          await uploadPartnerProductImage(id, editingProduct.id, imageFile)
        }

        // Обновляем товар в списке
        setProducts(prev => prev.map(p =>
          p.id === editingProduct.id
            ? { ...p, ...payload, imageUrl: imageFile ? URL.createObjectURL(imageFile) : p.imageUrl }
            : p
        ))
        setEditingProduct(null)
      } else {
        // Создание нового товара
        const created = await createPartnerProduct(id, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        })

        const newProductId = created?.id
        if (imageFile && newProductId) {
          await uploadPartnerProductImage(id, newProductId, imageFile)
        }

        // Добавляем новый товар в список
        const newProduct: Product = {
          id: newProductId || Date.now(),
          ...payload,
          imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
          createdAt: new Date().toISOString()
        }
        setProducts(prev => [...prev, newProduct])
        setShowAddForm(false)
      }
    } catch (err: any) {
      throw err
    }
  }

  const getPartnerImage = (partnerData: Partner) => {
    const imageSrc = partnerData.imageUrl || partnerData.image || partnerData.logo || partnerData.avatar || partnerData.photo
    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      return imageSrc
    }
    return null
  }

  const getPartnerIcon = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase()
    const icons: { [key: string]: string } = {
      'A': '🏪', 'B': '🏬', 'C': '🏭', 'D': '🏪', 'E': '🏬',
      'F': '🏭', 'G': '🏪', 'H': '🏬', 'I': '🏭', 'J': '🏪',
      'K': '🏬', 'L': '🏭', 'M': '🏪', 'N': '🏬', 'O': '🏭',
      'P': '🏪', 'Q': '🏬', 'R': '🏭', 'S': '🏪', 'T': '🏬',
      'U': '🏭', 'V': '🏪', 'W': '🏬', 'X': '🏭', 'Y': '🏪', 'Z': '🏬'
    }
    return icons[firstLetter] || '🏪'
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          flexDirection: 'column'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid var(--gray-300)',
            borderTop: '4px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <div style={{ color: 'var(--gray-600)', fontSize: '16px' }}>
            Загрузка информации о партнере...
          </div>
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="container">
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--gray-500)',
          background: 'var(--white)',
          borderRadius: '16px',
          border: '2px dashed var(--gray-300)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            {error || 'Партнер не найден'}
          </div>
          <button
            onClick={() => navigate('/partners')}
            style={{
              padding: '12px 24px',
              background: 'var(--gradient-primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginTop: '16px'
            }}
          >
            ← Вернуться к партнерам
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Навигационная цепочка */}
      <div className="breadcrumb" onClick={() => navigate('/partners')}>
        <span>🏠</span>
        <span>Партнеры</span>
        <span>→</span>
        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{partner.name}</span>
      </div>

      {/* Заголовок с информацией о партнере */}
      <div className="partner-detail-card" style={{
        background: 'var(--white)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
          {/* Картинка партнера */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            border: '3px solid var(--white)',
            flexShrink: 0
          }}>
            {getPartnerImage(partner) ? (
              <img
                src={getPartnerImage(partner)!}
                alt={partner.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  const target = e.currentTarget.parentElement
                  if (target) {
                    target.innerHTML = `<div style="width: 100%; height: 100%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: var(--white); font-size: 32px; font-weight: 700;">${getPartnerIcon(partner.name)}</div>`
                  }
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--white)',
                fontSize: '32px',
                fontWeight: '700'
              }}>
                {getPartnerIcon(partner.name)}
              </div>
            )}
          </div>

          {/* Информация о партнере */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--gray-900)',
              lineHeight: '1.2'
            }}>
              {partner.name}
            </h1>
            {partner.description && (
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                color: 'var(--gray-600)',
                lineHeight: '1.5'
              }}>
                {partner.description}
              </p>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '14px',
              color: 'var(--gray-500)'
            }}>
              <span>ID: #{String(partner.id).padStart(3, '0')}</span>
              {partner.createdAt && (
                <span>
                  Создан: {new Date(partner.createdAt).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '12px 20px',
                background: 'var(--gradient-primary)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
              <span>➕</span>
              Добавить товар
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-item">
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--accent)',
              marginBottom: '4px'
            }}>
              {products.length}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--gray-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Всего товаров
            </div>
          </div>

          <div className="stat-item">
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#16a34a',
              marginBottom: '4px'
            }}>
              {products.filter(p => (p.stock || 0) > 0).length}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--gray-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              В наличии
            </div>
          </div>

          <div className="stat-item">
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '4px'
            }}>
              {products.filter(p => (p.stock || 0) === 0).length}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--gray-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Нет в наличии
            </div>
          </div>

          <div className="stat-item">
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#7c3aed',
              marginBottom: '4px'
            }}>
              {products.length > 0 ? Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length) : 0}$
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--gray-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Средняя цена
            </div>
          </div>
        </div>
      </div>

      {/* Заголовок секции товаров */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--gray-900)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>📦</span>
          Товары партнера
        </h2>
        <div style={{
          fontSize: '14px',
          color: 'var(--gray-600)',
          background: 'var(--gray-50)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid var(--gray-200)'
        }}>
          {products.length} товар{products.length !== 1 ? 'ов' : ''}
        </div>
      </div>

      {/* Сетка товаров */}
      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <div key={String(product.id)} className="product-card-detail">
              {/* Картинка товара */}
              <div style={{
                width: '100%',
                height: '180px',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px',
                background: 'var(--gray-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--gray-200)'
              }}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      const target = e.currentTarget.parentElement
                      if (target) {
                        target.innerHTML = '<div style="font-size: 48px; opacity: 0.5;">📦</div>'
                      }
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '48px', opacity: 0.5 }}>📦</div>
                )}
              </div>

              {/* Информация о товаре */}
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  lineHeight: '1.3'
                }}>
                  {product.name}
                </h3>

                {product.description && (
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: 'var(--gray-600)',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.description}
                  </p>
                )}

                {/* Цена и наличие */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--accent)'
                  }}>
                    ${product.price || 0}
                  </div>

                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: product.stock && product.stock > 0 ? '#dcfce7' : '#fee2e2',
                    color: product.stock && product.stock > 0 ? '#16a34a' : '#dc2626'
                  }}>
                    {product.stock && product.stock > 0 ? `✅ ${product.stock} шт.` : '❌ Нет в наличии'}
                  </div>
                </div>

                {/* SKU и категория */}
                {(product.sku || product.category) && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: 'var(--gray-500)'
                  }}>
                    {product.sku && (
                      <span style={{
                        background: 'var(--gray-100)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace'
                      }}>
                        SKU: {product.sku}
                      </span>
                    )}
                    {product.category && (
                      <span style={{
                        background: 'var(--gray-100)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}>
                        {product.category}
                      </span>
                    )}
                  </div>
                )}

                {/* Кнопки действий */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditProduct(product)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--accent)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(7, 185, 129, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    ✏️ Изменить
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(product)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--gray-100)',
                      color: 'var(--gray-700)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: 'var(--gray-500)',
          background: 'var(--white)',
          borderRadius: '16px',
          border: '2px dashed var(--gray-300)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>📦</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            У партнера пока нет товаров
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>
            Добавьте первый товар для этого партнера
          </div>
          <button
            onClick={() => setShowAddForm(true)}
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
            ➕ Добавить первый товар
          </button>
        </div>
      )}

      {/* Модальные окна */}
      {showAddForm && (
        <ProductForm
          onCancel={() => setShowAddForm(false)}
          onSave={handleSaveProduct}
        />
      )}

      {editingProduct && (
        <ProductForm
          initial={{
            id: editingProduct.id,
            name: editingProduct.name,
            description: editingProduct.description,
            price: editingProduct.price,
            sku: editingProduct.sku,
            stock: editingProduct.stock,
            category: editingProduct.category
          }}
          onCancel={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {deletingProduct && (
        <ConfirmDialog
          title="Удалить товар"
          message={`Удалить "${deletingProduct.name}"? Это действие нельзя отменить.`}
          onCancel={() => setDeletingProduct(null)}
          onConfirm={confirmDeleteProduct}
        />
      )}
    </div>
  )
}
