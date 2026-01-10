import { useEffect, useState } from 'react'
import { fetchPartnerProducts, updatePartnerProduct } from '../api/client'

type Product = {
  id: string | number
  name: string
  description?: string
  price?: number
  imageUrl?: string
  category?: string
  isAvailable?: boolean
  stock?: number
}

export default function Products({ onError }: { onError?: (msg: string) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await fetchPartnerProducts()
      const productsList = Array.isArray(data) ? data : (data.items || data.data || [])
      setProducts(productsList)
    } catch (err: any) {
      console.error('Error loading products:', err)
      onError?.('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAvailability = async (product: Product, isAvailable: boolean) => {
    try {
      await updatePartnerProduct(product.id, { isAvailable })
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, isAvailable } : p
      ))
    } catch (err: any) {
      console.error('Error updating product:', err)
      onError?.('Ошибка обновления товара')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        Загрузка товаров...
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--gray-900)',
          margin: 0
        }}>
          Мои товары
        </h1>
        <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
          Всего: {products.length} товаров
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--gray-500)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--gray-700)' }}>
            У вас пока нет товаров
          </h3>
          <p>Ваши товары появятся здесь после добавления через админ панель</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {products.map((product) => (
            <div key={product.id} style={{
              background: 'var(--white)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--gray-200)'
            }}>
              {/* Product Image */}
              <div style={{
                width: '100%',
                height: '200px',
                background: product.imageUrl ? `url(${product.imageUrl})` : 'var(--gray-100)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gray-400)',
                fontSize: '48px'
              }}>
                {!product.imageUrl && '📦'}
              </div>

              {/* Product Info */}
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}>
                {product.name}
              </h3>

              {product.description && (
                <p style={{
                  fontSize: '14px',
                  color: 'var(--gray-600)',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {product.description.length > 100
                    ? product.description.substring(0, 100) + '...'
                    : product.description
                  }
                </p>
              )}

              {/* Price */}
              {product.price && (
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--green-600)',
                  marginBottom: '12px'
                }}>
                  {product.price.toLocaleString()} ₽
                </div>
              )}

              {/* Category & Stock */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                {product.category && (
                  <span style={{
                    fontSize: '12px',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    {product.category}
                  </span>
                )}
                {product.stock !== undefined && (
                  <span style={{
                    fontSize: '12px',
                    color: product.stock > 0 ? 'var(--green-600)' : 'var(--red-600)',
                    fontWeight: '500'
                  }}>
                    В наличии: {product.stock}
                  </span>
                )}
              </div>

              {/* Availability Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: 'var(--gray-700)',
                  fontWeight: '500'
                }}>
                  Доступен для продажи
                </span>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '44px',
                  height: '24px'
                }}>
                  <input
                    type="checkbox"
                    checked={product.isAvailable || false}
                    onChange={(e) => handleUpdateAvailability(product, e.target.checked)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: product.isAvailable ? 'var(--green-500)' : 'var(--gray-300)',
                    transition: '0.3s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: product.isAvailable ? '22px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
