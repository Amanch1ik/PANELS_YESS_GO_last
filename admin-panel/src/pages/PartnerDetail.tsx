import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPartners, fetchPartnerProducts, createPartnerProduct, updatePartnerProduct, deletePartnerProduct, uploadPartnerProductImage } from '../api/client'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { resolveAssetUrl } from '../utils/assets'
import { normalizePartner } from '../services/normalize'
import PartnerAvatar from '../components/PartnerAvatar'

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
  /* Partner logo / avatar styling (match web-version) */
  .partner-logo {
    border-radius: 50%;
    overflow: hidden;
    border: none;
    box-shadow: none;
    width: 80px;
    height: 80px;
    min-width: 80px;
    min-height: 80px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .partner-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .partner-logo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
    color: var(--white);
    font-size: 32px;
    font-weight: 700;
  }
  /* Avatar box with inner circular image to match web-version look */
  .partner-avatar-box {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    background: var(--white);
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .partner-avatar-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
  }
  .partner-avatar-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
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
  image?: string
  logo?: string
  avatar?: string
  photo?: string
  picture?: string
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
  image?: string
  photo?: string
  picture?: string
  thumbnail?: string
  createdAt?: string
}

export default function PartnerDetail({ onError }: { onError?: (msg: string) => void }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [logoLoaded, setLogoLoaded] = useState<boolean | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

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
      // normalize partner to ensure logoUrl/coverUrl are available
      let normalizedPartner = currentPartner
      try {
        normalizedPartner = normalizePartner(currentPartner)
      } catch {
        // fallback to raw partner if normalization fails
        normalizedPartner = currentPartner
      }

      setPartner(normalizedPartner)

      // Загружаем товары партнера
      try {
        const productsData = await fetchPartnerProducts(id as string)
        const productsList = Array.isArray(productsData) ? productsData : (productsData.items || productsData.data || [])

        // normalize products
        try {
          const { normalizeProduct } = await import('../services/normalize')
          const normalized = productsList.map((pr: any) => normalizeProduct(pr))
          setProducts(normalized)
        } catch {
          setProducts(productsList)
        }
        // setProducts handled in normalization block above
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

  const handleSaveProduct = async (payload: any, imageFile?: File | null) => {
    if (!id) return
    const partnerId = id // id is guaranteed to be defined here

    try {
      if (editingProduct) {
        // Обновление существующего товара
        await updatePartnerProduct(partnerId, editingProduct.id, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        })

        if (imageFile) {
          await uploadPartnerProductImage(partnerId, editingProduct.id, imageFile)
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
        const created = await createPartnerProduct(partnerId, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          stock: payload.stock,
          category: payload.category
        })

        const newProductId = created?.id
        if (imageFile && newProductId) {
          await uploadPartnerProductImage(partnerId, newProductId, imageFile)
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

  const getPartnerImage = (partnerData: any) => {
    // Проверяем различные возможные поля с картинками
    let imageSrc = partnerData.imageUrl || partnerData.image || partnerData.logo ||
                   partnerData.avatar || partnerData.photo || partnerData.picture

    // Если это массив изображений, берем первое
    if (Array.isArray(partnerData.images) && partnerData.images.length > 0) {
      imageSrc = partnerData.images[0]
    }
    if (Array.isArray(partnerData.photos) && partnerData.photos.length > 0) {
      imageSrc = partnerData.photos[0]
    }

    // Проверяем, что это валидная строка URL
    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      // Если это относительный путь, добавляем базовый URL
      if (!imageSrc.startsWith('http') && !imageSrc.startsWith('data:')) {
        imageSrc = `https://api.yessgo.org${imageSrc.startsWith('/') ? '' : '/'}${imageSrc}`
      }
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

  // Helpers to determine stock from various possible API fields
  const getStockNumber = (p: any): number | null => {
    if (!p) return null
    const candidates = ['stock', 'quantity', 'qty', 'count', 'available_count', 'stock_count']
    for (const key of candidates) {
      const v = (p as any)[key]
      if (v === undefined || v === null) continue
      if (typeof v === 'boolean') return v ? 1 : 0
      const num = Number(v)
      if (!Number.isNaN(num)) return Math.floor(num)
    }
    return null
  }

  const isInStock = (p: any): boolean => {
    const n = getStockNumber(p)
    if (n !== null) return n > 0
    // check boolean/flag fields commonly used by APIs
    if ((p as any).available === true || (p as any).is_available === true || (p as any).in_stock === true) return true
    return false
  }

  // Robust product image extractor — supports strings, arrays, and common nested objects
  const getProductImage = (prod: any): string | null => {
    if (!prod) return null

    const tryExtract = (val: any): string | null => {
      if (val === undefined || val === null) return null
      if (typeof val === 'string') return val
      if (Array.isArray(val) && val.length > 0) return tryExtract(val[0])
      if (typeof val === 'object') {
        // Common fields
        if (typeof val.url === 'string' && val.url) return val.url
        if (typeof val.path === 'string' && val.path) return val.path
        if (typeof val.src === 'string' && val.src) return val.src
        if (typeof val.file === 'string' && val.file) return val.file
        // Strapi-like payloads
        if (val.data && (val.data.url || (val.data.attributes && val.data.attributes.url))) {
          return val.data.url || val.data.attributes.url
        }
        if (val.attributes && (val.attributes.url || val.attributes.path)) {
          return val.attributes.url || val.attributes.path
        }
      }
      return null
    }

    // try to resolve fields case-insensitively (API may return PascalCase like ImageUrl)
    const fieldNames = ['imageUrl', 'image', 'photo', 'picture', 'thumbnail', 'media', 'file', 'image_path', 'url', 'Images', 'Photos']
    const candidates: any[] = []
    for (const name of fieldNames) {
      // direct lookup
      if (prod && Object.prototype.hasOwnProperty.call(prod, name)) candidates.push((prod as any)[name])
      // case-insensitive search
      const foundKey = prod && Object.keys(prod).find(k => k.toLowerCase() === name.toLowerCase())
      if (foundKey) candidates.push((prod as any)[foundKey])
    }

    for (const c of candidates) {
      const found = tryExtract(c)
      if (found) {
        const resolved = resolveAssetUrl(found)
        if (resolved) return resolved
        return found
      }
    }

    // Arrays specifically on the product object
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      const found = tryExtract(prod.images[0])
      if (found) return found.startsWith('http') || found.startsWith('data:') ? found : `https://api.yessgo.org${found.startsWith('/') ? '' : '/'}${found}`
    }
    if (Array.isArray(prod.photos) && prod.photos.length > 0) {
      const found = tryExtract(prod.photos[0])
      if (found) return found.startsWith('http') || found.startsWith('data:') ? found : `https://api.yessgo.org${found.startsWith('/') ? '' : '/'}${found}`
    }

    return null
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
      {/* Lightbox modal for product images */}
      {lightboxSrc && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              background: 'var(--white)'
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLightboxSrc(null)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  zIndex: 2,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 8px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
              <img
                src={lightboxSrc!}
                alt="Preview"
                style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 48px)', objectFit: 'contain', background: 'var(--gray-100)' }}
              />
            </div>
          </div>
        </div>
      )}
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
            boxShadow: 'none',
            border: 'none',
            flexShrink: 0
          }}>
            {(() => {
              const logoUrl = (partner as any).logoUrl || getPartnerImage(partner)
              return (
                <div
                  style={{ width: '100%', height: '100%', position: 'relative', cursor: logoUrl ? 'pointer' : 'default' }}
                  className="partner-logo"
                  role={logoUrl ? 'button' : undefined}
                  tabIndex={logoUrl ? 0 : undefined}
                  onClick={() => { if (logoUrl) setLightboxSrc(logoUrl) }}
                  onKeyDown={(e) => { if (logoUrl && (e.key === 'Enter' || e.key === ' ')) { setLightboxSrc(logoUrl) } }}
                >
                  <PartnerAvatar partner={partner} size={80} innerCircle={60} />
                </div>
              )
            })()}
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
                fontSize: '14px',
                color: 'var(--gray-600)',
                lineHeight: '1.4',
                textAlign: 'justify',
                hyphens: 'auto',
                maxWidth: '100%',
                marginBottom: '12px'
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
              {products.filter(p => isInStock(p)).length}
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
              {products.filter(p => !isInStock(p)).length}
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
              {products.length > 0 ? Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length) : 0} сом
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

      {/* Сетка товаров по категориям */}
      {products.length > 0 ? (
        <div>
          {/* Группируем товары по категориям */}
          {(() => {
            const productsByCategory = products.reduce((acc, product) => {
              const category = product.category || 'Без категории'
              if (!acc[category]) {
                acc[category] = []
              }
              acc[category].push(product)
              return acc
            }, {} as Record<string, typeof products>)

            return Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <div key={category} style={{ marginBottom: '40px' }}>
                {/* Заголовок категории */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%)',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-200)',
                  color: 'var(--gray-900)'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--gray-900)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {category}
                    </span>
                  </h3>
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--gray-600)',
                    fontWeight: '500'
                  }}>
                    {categoryProducts.length} товар{categoryProducts.length !== 1 ? 'ов' : ''}
                  </div>
                </div>

                {/* Сетка товаров в категории */}
                <div className="product-grid">
                  {categoryProducts.map((product) => (
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
                {(() => {
                  const imageSrc = getProductImage(product)
                  if (imageSrc) {
                    return (
                      <img
                        src={imageSrc}
                        alt={product.name}
                        width={180}
                        height={180}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          background: 'var(--gray-100)',
                          transition: 'transform 200ms ease, opacity 200ms ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => setLightboxSrc(imageSrc)}
                        onError={(e) => {
                          console.warn(`❌ Ошибка загрузки картинки товара ${product.id}:`, imageSrc)
                          const target = e.currentTarget.parentElement
                          if (target) {
                            target.innerHTML = '<div style="font-size: 48px; opacity: 0.5;">📦</div>'
                          }
                        }}
                      />
                    )
                  }
                  return <div style={{ fontSize: '48px', opacity: 0.5 }}>📦</div>
                })()}
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
                    {product.price || 0} сом
                  </div>

                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: isInStock(product) ? '#dcfce7' : '#fee2e2',
                    color: isInStock(product) ? '#16a34a' : '#dc2626'
                  }}>
                    {(() => {
                      const stockNum = getStockNumber(product)
                      if (stockNum !== null) {
                        return stockNum > 0 ? `✅ ${stockNum} шт.` : '❌ Нет в наличии'
                      }
                      // If we only have a boolean flag, show availability without count
                      if (isInStock(product)) return '✅ В наличии'
                      return '❌ Нет в наличии'
                    })()}
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
              </div>
            ))
          })()}
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
