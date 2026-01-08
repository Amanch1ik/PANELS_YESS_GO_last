import React, { useState } from 'react'

type PartnerInput = {
  id?: number | string
  name?: string
  category?: string
  phone?: string
  password?: string
  description?: string
  logo_url?: string
  cover_image_url?: string
  city_id?: number
  max_discount_percent?: number
  address?: string
  two_gis_url?: string
  email?: string
  cashback_rate?: number
  website?: string
}

export default function PartnerForm2({ initial, onCancel, onSave }: {
  initial?: PartnerInput
  onCancel: () => void
  onSave: (payload: PartnerInput, imageFile?: File | null) => Promise<void>
}) {
  // Только самые необходимые поля для быстрого создания
  const [name, setName] = useState(initial?.name || '')
  const [category, setCategory] = useState(initial?.category || 'Рестораны')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [password, setPassword] = useState(initial?.password || '')
  const [address, setAddress] = useState(initial?.address || '')
  const [email, setEmail] = useState(initial?.email || '')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [useUrl, setUseUrl] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      // Простая валидация обязательных полей
      if (!name.trim()) {
        setError('Введите название партнера')
        setSaving(false)
        return
      }
      if (!phone.trim()) {
        setError('Введите номер телефона')
        setSaving(false)
        return
      }
      if (!password.trim()) {
        setError('Введите пароль')
        setSaving(false)
        return
      }
      if (password.length < 8) {
        setError('Пароль должен быть не менее 8 символов')
        setSaving(false)
        return
      }

      // Минимальный payload для создания партнера
      const payload: PartnerInput = {
        name: name.trim(),
        category: category.trim(),
        phone: phone.trim(),
        password: password.trim(),
        description: `${name.trim()} - партнер YESS!GO`,
        // Добавляем базовые значения для обязательных полей
        city_id: 1,
        max_discount_percent: 20,
        address: address.trim() || 'г. Бишкек',
        two_gis_url: 'https://2gis.kg/bishkek',
        email: email.trim() || undefined,
        // Добавляем логотип если указан
        ...(logoUrl.trim() && { logo_url: logoUrl.trim() })
      }

      console.log('📤 Отправляем данные партнера:', payload)
      await onSave(payload, imageFile)
      console.log('✅ Партнер успешно создан!')

    } catch (err: any) {
      console.error('❌ Ошибка создания партнера:', err)
      setError(err?.message || 'Ошибка при создании партнера. Попробуйте еще раз.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2,6,23,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      zIndex: 80
    }}>
      <div className="card" style={{ width: 'min(760px,100%)', maxHeight: '90vh', overflowY: 'auto', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{initial ? '✏️ Редактировать партнера' : '➕ Новый партнер'}</h3>
        </div>

        {error && (
          <div style={{
            marginBottom: 12,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {saving && (
          <div style={{
            marginBottom: 12,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(7, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%)',
            border: '1px solid rgba(7, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#059669',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(7, 185, 129, 0.3)',
              borderTop: '2px solid #059669',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Создание партнера...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Основная информация */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--gray-800)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Основная информация
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Название партнера *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Cafe Central"
                  required
                  className="input"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Категория</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }}
                >
                  <option value="Рестораны">🍽️ Рестораны</option>
                  <option value="Кафе">☕ Кафе</option>
                  <option value="Магазины">🛍️ Магазины</option>
                  <option value="Супермаркеты">🏪 Супермаркеты</option>
                  <option value="Услуги">🔧 Услуги</option>
                  <option value="Развлечения">🎭 Развлечения</option>
                  <option value="Здоровье">🏥 Здоровье</option>
                  <option value="Образование">📚 Образование</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Телефон *</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+996 555 123 456"
                  required
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Пароль *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Адрес</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="г. Бишкек, ул. Ленина, 123"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }}
              />
            </div>
          </div>

          {/* Логотип (опционально) */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--gray-800)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              🖼️ Логотип <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--gray-500)' }}>(необязательно)</span>
            </h4>

            {/* Переключатель типа загрузки */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="logoType"
                  checked={!useUrl}
                  onChange={() => {
                    setUseUrl(false)
                    setLogoUrl('')
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ color: 'var(--gray-700)' }}>Загрузить файл</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="logoType"
                  checked={useUrl}
                  onChange={() => {
                    setUseUrl(true)
                    setImageFile(null)
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ color: 'var(--gray-700)' }}>Указать URL</span>
              </label>
            </div>

            {useUrl ? (
              /* Поле для URL */
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>URL логотипа</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-300)',
                    background: 'var(--white)',
                    color: 'var(--gray-900)',
                    fontSize: '14px'
                  }}
                />
                {logoUrl && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <img
                      src={logoUrl}
                      alt="Предпросмотр логотипа"
                      style={{
                        maxWidth: '150px',
                        maxHeight: '150px',
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Загрузка файла */
              <div style={{
                border: '2px dashed var(--gray-300)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                background: 'var(--gray-50)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--gray-100)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--gray-300)';
                e.currentTarget.style.background = 'var(--gray-50)';
              }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
                  style={{ display: 'none' }}
                  id="partner-logo"
                />
                <label htmlFor="partner-logo" style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'block' }}>
                  {imageFile ? (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📁</div>
                      <div style={{ color: 'var(--gray-700)', fontWeight: 600 }}>Выбран файл: {imageFile.name}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: '14px', marginTop: '4px' }}>
                        Размер: {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📤</div>
                      <div style={{ color: 'var(--gray-700)', fontWeight: 600 }}>Нажмите для выбора логотипа</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: '14px', marginTop: '4px' }}>
                        Поддерживаются: JPG, PNG, GIF (макс. 5MB)
                      </div>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '24px',
            borderTop: '1px solid var(--gray-200)',
            marginTop: '32px'
          }}>
            <button
              type="button"
              onClick={onCancel}
              className="button"
              style={{
                background: 'var(--gray-100)',
                color: 'var(--gray-700)',
                border: '1px solid var(--gray-300)'
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="button"
              style={{
                background: 'var(--accent)',
                color: 'var(--white)',
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Создание...' : '➕ Создать партнера'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


