import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPartners, createPartner, updatePartner, deletePartner, uploadPartnerImage,
  fetchPartnerProducts, createPartnerProduct, deletePartnerProduct, uploadPartnerProductImage, updatePartnerProduct, testPartnerAPI, clearApiCache } from '../api/client'
import ProductForm from '../components/ProductForm'
import PartnerProductsPanel from '../components/PartnerProductsPanel'
import PartnerForm from '../components/PartnerForm2'
import ConfirmDialog from '../components/ConfirmDialog'
import PartnerAvatar from '../components/PartnerAvatar'
import { resolveAssetUrl } from '../utils/assets'
import PartnerCredentialsModal from '../components/PartnerCredentialsModal'

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
 
  /* Partner logo UI consistent with web-version */
  .partner-avatar-wrapper {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .partner-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 12px;
  }
  .partner-logo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .partner-logo-text {
    font-size: 26px;
    font-weight: 700;
    color: #07b981;
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
  is_active?: boolean
  is_verified?: boolean
  price?: number
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Partner | null>(null)
  const [testingAPI, setTestingAPI] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)
  const navigate = useNavigate()
  const [credModalPartner, setCredModalPartner] = useState<Partner | null>(null)


  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPartners()
      const list = Array.isArray(data) ? data : (data.items || data.data || [])
      // normalize partners using service logic
      try {
        const { normalizePartner } = await import('../services/normalize')
        setPartners(list.map((p: any) => normalizePartner(p)))
      } catch {
        setPartners(list)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Robust partner image extractor — supports strings, arrays and nested objects
  const getPartnerImage = (partnerData: any): string | null => {
    if (!partnerData) return null
    const tryExtract = (val: any): string | null => {
      if (val === undefined || val === null) return null
      if (typeof val === 'string') return val
      if (Array.isArray(val) && val.length > 0) return tryExtract(val[0])
      if (typeof val === 'object') {
        if (typeof val.url === 'string' && val.url) return val.url
        if (typeof val.path === 'string' && val.path) return val.path
        if (typeof val.src === 'string' && val.src) return val.src
        if (typeof val.file === 'string' && val.file) return val.file
        if (val.data && (val.data.url || (val.data.attributes && val.data.attributes.url))) {
          return val.data.url || val.data.attributes.url
        }
        if (val.attributes && (val.attributes.url || val.attributes.path)) {
          return val.attributes.url || val.attributes.path
        }
      }
      return null
    }

    const fieldNames = ['logoUrl','LogoUrl','Logo','logo','coverImageUrl','CoverImageUrl','cover','Cover','imageUrl','ImageUrl','image','Image','photo','Photo','picture','Picture','thumbnail','Thumbnail','media','Media','file','File','url','Url','images','Images','photos','Photos']
    const candidates: any[] = []
    for (const name of fieldNames) {
      if (partnerData && Object.prototype.hasOwnProperty.call(partnerData, name)) candidates.push((partnerData as any)[name])
      const foundKey = partnerData && Object.keys(partnerData).find(k => k.toLowerCase() === name.toLowerCase())
      if (foundKey) candidates.push((partnerData as any)[foundKey])
    }

    for (const c of candidates) {
      const found = tryExtract(c)
      if (found) {
        const resolved = resolveAssetUrl(found)
        if (resolved) return resolved
        return found
      }
    }

    if (Array.isArray(partnerData.images) && partnerData.images.length > 0) {
      const found = tryExtract(partnerData.images[0])
      if (found) return found.startsWith('http') || found.startsWith('data:') ? found : `https://api.yessgo.org${found.startsWith('/') ? '' : '/'}${found}`
    }
    if (Array.isArray(partnerData.photos) && partnerData.photos.length > 0) {
      const found = tryExtract(partnerData.photos[0])
      if (found) return found.startsWith('http') || found.startsWith('data:') ? found : `https://api.yessgo.org${found.startsWith('/') ? '' : '/'}${found}`
    }

    return null
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

  const handleSave = async (payload: any, imageFile?: File | null) => {
    try {
      if (payload.id) {
        // Update existing partner
        await updatePartner(payload.id, {
          name: payload.name,
          description: payload.description,
          category: payload.category,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          website: payload.website,
          two_gis_url: payload.two_gis_url,
          max_discount_percent: payload.max_discount_percent,
          cashback_rate: payload.cashback_rate
        })
        if (imageFile) {
          await uploadPartnerImage(payload.id, imageFile)
        }
      } else {
        // Create new partner
        const created = await createPartner({
          name: payload.name,
          description: payload.description,
          category: payload.category,
          phone: payload.phone,
          email: payload.email,
          // pass password collected from form to backend create call
          password: payload.password,
          address: payload.address,
          website: payload.website,
          two_gis_url: payload.two_gis_url,
          max_discount_percent: payload.max_discount_percent,
          cashback_rate: payload.cashback_rate
        })
        const newId = created?.id || created?.data?.id
        if (imageFile && newId) {
          await uploadPartnerImage(newId, imageFile)
        }
      }
      await load()
      setCreating(false)
      setEditing(null)
    } catch (err: any) {
      throw err
    }
  }

  const handleTestAPI = async () => {
    setTestingAPI(true)
    setError(null)
    try {
      await testPartnerAPI()
      alert('Тестирование API завершено. Проверьте консоль разработчика (F12) для результатов.')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Ошибка тестирования API'
      setError(msg)
      console.error('❌ Ошибка тестирования API:', err)
      alert(`Ошибка тестирования API: ${msg}`)
    } finally {
      setTestingAPI(false)
    }
  }

  const handleClearCache = async () => {
    setClearingCache(true)
    try {
      clearApiCache()
      await load() // Перезагружаем данные
      alert('Кэш очищен! Данные обновлены с сервера.')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Ошибка очистки кэша'
      setError(msg)
      console.error('❌ Ошибка очистки кэша:', err)
      alert(`Ошибка очистки кэша: ${msg}`)
    } finally {
      setClearingCache(false)
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
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '32px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}>
              🏪
            </span>
            Партнеры
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

        {/* Test API button removed per user request */}

        {/* Cache clear button removed per user request */}
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
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--white)',
            fontSize: '40px',
            margin: '0 auto 16px auto',
            opacity: 0.7
          }}>
            🏪
          </div>
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
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: 'none',
                  background: 'transparent'
                }}>
                  <PartnerAvatar partner={p} size={56} innerCircle={48} />
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

              {/* Статус партнера */}
              <div style={{
                marginBottom: '20px',
                padding: '12px 16px',
                background: p.is_active !== false ? '#dcfce7' : '#fee2e2',
                borderRadius: '8px',
                border: `1px solid ${p.is_active !== false ? '#16a34a' : '#dc2626'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '16px',
                  color: p.is_active !== false ? '#16a34a' : '#dc2626'
                }}>
                  {p.is_active !== false ? '✅' : '❌'}
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: p.is_active !== false ? '#16a34a' : '#dc2626'
                }}>
                  {p.is_active !== false ? 'Активен' : 'Неактивен'}
                </span>
                {p.is_verified && (
                  <span style={{
                    fontSize: '12px',
                    background: '#16a34a',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: 'auto'
                  }}>
                    ✓ Проверен
                  </span>
                )}
              </div>

              {/* Кнопки действий */}
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => navigate(`/partners/${p.id}`)}
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
                    e.currentTarget.style.background = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--white)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gray-100)'
                    e.currentTarget.style.color = 'var(--gray-700)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  📦 Перейти к товарам
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
                  onClick={() => setCredModalPartner(p)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--gray-50)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔑 Учётные
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

            </div>
          ))}
        </div>
      )}

      {/* Модальные окна */}
      {creating && <PartnerForm onCancel={() => setCreating(false)} onSave={handleSave} />}
      {editing && <PartnerForm initial={editing as any} onCancel={() => setEditing(null)} onSave={handleSave} />}
      {deleting && <ConfirmDialog title="Удалить партнера" message={`Удалить "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={performDelete} />}
      {credModalPartner && <PartnerCredentialsModal partnerId={credModalPartner.id} partnerName={credModalPartner.name} onClose={() => setCredModalPartner(null)} onCreated={(res) => { alert('Учётные данные созданы'); setCredModalPartner(null) }} />}
    </div>
  )
}


