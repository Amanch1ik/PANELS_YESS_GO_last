import React, { useState } from 'react'

type PartnerInput = {
  id?: number | string
  name: string
  category: string
  phone: string
  password: string
  description: string
  logo_url: string
  cover_image_url: string
  city_id: number
  max_discount_percent: number
  address: string
  two_gis_url: string
  email?: string
  cashback_rate?: number
  website?: string
}

export default function PartnerForm({ initial, onCancel, onSave }: {
  initial?: PartnerInput
  onCancel: () => void
  onSave: (payload: PartnerInput, imageFile?: File | null) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name || '')
  const [category, setCategory] = useState(initial?.category || 'Рестораны')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [password, setPassword] = useState(initial?.password || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || 'https://via.placeholder.com/200x200?text=Logo')
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.cover_image_url || 'https://via.placeholder.com/800x400?text=Cover')
  const [cityId, setCityId] = useState(initial?.city_id || 1)
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(initial?.max_discount_percent || 20)
  const [address, setAddress] = useState(initial?.address || '')
  const [twoGisUrl, setTwoGisUrl] = useState(initial?.two_gis_url || 'https://2gis.kg/bishkek')
  const [email, setEmail] = useState(initial?.email || '')
  const [cashbackRate, setCashbackRate] = useState(initial?.cashback_rate || 5)
  const [website, setWebsite] = useState(initial?.website || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    // Валидация обязательных полей
    const requiredFields = [
      { field: name, name: 'Название' },
      { field: category, name: 'Категория' },
      { field: phone, name: 'Телефон' },
      { field: password, name: 'Пароль' },
      { field: description, name: 'Описание' },
      { field: logoUrl, name: 'URL логотипа' },
      { field: coverImageUrl, name: 'URL обложки' },
      { field: cityId, name: 'ID города' },
      { field: maxDiscountPercent, name: 'Макс. скидка' },
      { field: address, name: 'Адрес' },
      { field: twoGisUrl, name: 'Ссылка 2GIS' }
    ]

    const emptyFields = requiredFields.filter(f => !f.field || f.field.toString().trim() === '')
    if (emptyFields.length > 0) {
      setError(`Заполните обязательные поля: ${emptyFields.map(f => f.name).join(', ')}`)
      setSaving(false)
      return
    }

    // Валидация URL полей
    const urlFields = [
      { value: logoUrl, name: 'URL логотипа' },
      { value: coverImageUrl, name: 'URL обложки' },
      { value: twoGisUrl, name: 'Ссылка 2GIS' }
    ]

    for (const urlField of urlFields) {
      try {
        new URL(urlField.value)
      } catch {
        setError(`${urlField.name} должен быть валидным URL`)
        setSaving(false)
        return
      }
    }

    // Валидация email если заполнен
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError('Email должен быть в правильном формате')
        setSaving(false)
        return
      }
    }

    // Валидация website URL если заполнен
    if (website && website.trim()) {
      try {
        new URL(website.trim())
      } catch {
        setError('Веб-сайт должен быть валидным URL')
        setSaving(false)
        return
      }
    }

    // Валидация числовых полей
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
      setError('ID города должен быть положительным числом')
      setSaving(false)
      return
    }

    if (isNaN(Number(maxDiscountPercent)) || Number(maxDiscountPercent) < 0 || Number(maxDiscountPercent) > 100) {
      setError('Максимальная скидка должна быть числом от 0 до 100')
      setSaving(false)
      return
    }

    if (cashbackRate && (isNaN(Number(cashbackRate)) || Number(cashbackRate) < 0 || Number(cashbackRate) > 100)) {
      setError('Кэшбэк должен быть числом от 0 до 100')
      setSaving(false)
      return
    }

    // Валидация пароля
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      setSaving(false)
      return
    }

    try {
      const partnerData = {
        name: name.trim(),
        category: category.trim(),
        phone: phone.trim(),
        password: password.trim(),
        description: description.trim(),
        logo_url: logoUrl.trim(),
        cover_image_url: coverImageUrl.trim(),
        city_id: Number(cityId),
        max_discount_percent: Number(maxDiscountPercent),
        address: address.trim(),
        two_gis_url: twoGisUrl.trim(),
        ...(email && { email: email.trim() }),
        ...(cashbackRate && !isNaN(Number(cashbackRate)) && { cashback_rate: Number(cashbackRate) }),
        ...(website && { website: website.trim() })
      }

      console.log('Отправка данных партнера:', partnerData) // Для отладки

      await onSave(partnerData, imageFile)
    } catch (err: any) {
      console.error('Ошибка создания партнера:', err.response?.data || err)
      setError(err?.response?.data?.message || err?.message || 'Ошибка сохранения партнера')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 83, 58, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 80,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #022c1f 0%, rgba(7, 185, 129, 0.1) 100%)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 25px 50px rgba(3, 83, 58, 0.4)',
        border: '1px solid rgba(7, 185, 129, 0.3)',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Декоративные элементы */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #07B981 0%, #34d399 100%)',
          borderRadius: '50%',
          opacity: 0.6
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #34d399 0%, #07B981 100%)',
          borderRadius: '50%',
          opacity: 0.4
        }}></div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h3 style={{
            color: 'var(--gray-900)',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            {initial ? '✏️ Редактировать партнера' : '➕ Новый партнер'}
          </h3>
          <div style={{
            width: '60px',
            height: '3px',
            background: 'var(--accent)',
            borderRadius: '2px',
            margin: '0 auto'
          }}></div>
        </div>

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          {/* Основная информация */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              color: 'var(--gray-800)',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 Основная информация
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--gray-700)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px'
                }}>
                  Название партнера *
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Введите название партнера"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(7, 185, 129, 0.3)',
                    background: 'rgba(7, 185, 129, 0.08)',
                    color: '#ffffff',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#07B981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--gray-700)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px'
                }}>
                  Категория *
                </label>
                <input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Например: Рестораны, Магазины"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(7, 185, 129, 0.3)',
                    background: 'rgba(7, 185, 129, 0.08)',
                    color: '#ffffff',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#07B981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--gray-700)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px'
                }}>
                  Телефон *
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+996 XXX XXX XXX"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(7, 185, 129, 0.3)',
                    background: 'rgba(7, 185, 129, 0.08)',
                    color: '#ffffff',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#07B981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--gray-700)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px'
                }}>
                  Пароль *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(7, 185, 129, 0.3)',
                    background: 'rgba(7, 185, 129, 0.08)',
                    color: '#ffffff',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#07B981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                />
              </div>
            </div>

            {/* Контактная информация */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                color: '#07B981',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📍 Контактная информация
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--gray-700)',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    Адрес *
                  </label>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Полный адрес партнера"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(7, 185, 129, 0.3)',
                      background: 'rgba(7, 185, 129, 0.08)',
                      color: '#ffffff',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#07B981'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--gray-700)',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    Ссылка 2GIS *
                  </label>
                  <input
                    value={twoGisUrl}
                    onChange={e => setTwoGisUrl(e.target.value)}
                    placeholder="https://2gis.kg/..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(7, 185, 129, 0.3)',
                      background: 'rgba(7, 185, 129, 0.08)',
                      color: '#ffffff',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#07B981'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                  />
                </div>
                </div>
              </div>

              {/* Настройки и дополнительные поля */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  color: 'var(--gray-700)',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚙️ Настройки и медиа
                </h4>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--gray-700)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      URL логотипа *
                    </label>
                    <input
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(7, 185, 129, 0.3)',
                        background: 'rgba(7, 185, 129, 0.08)',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#07B981'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--gray-700)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      URL обложки *
                    </label>
                    <input
                      value={coverImageUrl}
                      onChange={e => setCoverImageUrl(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(7, 185, 129, 0.3)',
                        background: 'rgba(7, 185, 129, 0.08)',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#07B981'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--gray-700)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      ID города *
                    </label>
                    <input
                      type="number"
                      value={cityId}
                      onChange={e => setCityId(Number(e.target.value))}
                      placeholder="1 (ID города в системе)"
                      required
                      min="1"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(7, 185, 129, 0.3)',
                        background: 'rgba(7, 185, 129, 0.08)',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#07B981'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--gray-700)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      Макс. скидка % *
                    </label>
                    <input
                      type="number"
                      value={maxDiscountPercent}
                      onChange={e => setMaxDiscountPercent(Number(e.target.value))}
                      placeholder="20 (процент скидки)"
                      min="0"
                      max="100"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(7, 185, 129, 0.3)',
                        background: 'rgba(7, 185, 129, 0.08)',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#07B981'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--gray-700)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="partner@example.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(7, 185, 129, 0.3)',
                        background: 'rgba(7, 185, 129, 0.08)',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#07B981'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--gray-700)',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      Кэшбэк %
                    </label>
                    <input
                      type="number"
                      value={cashbackRate}
                      onChange={e => setCashbackRate(Number(e.target.value))}
                      placeholder="5"
                      min="0"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(7, 185, 129, 0.3)',
                        background: 'rgba(7, 185, 129, 0.08)',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#07B981'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                    />
                  </div>
                </div>

                {/* Описание */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--gray-700)',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    Описание партнера *
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Подробное описание партнера, его услуг и преимуществ..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(7, 185, 129, 0.3)',
                      background: 'rgba(7, 185, 129, 0.08)',
                      color: '#ffffff',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#07B981'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                  />
                </div>

                {/* Веб-сайт */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--gray-700)',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    Веб-сайт
                  </label>
                  <input
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://partner-website.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(7, 185, 129, 0.3)',
                      background: 'rgba(7, 185, 129, 0.08)',
                      color: '#ffffff',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#07B981'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)'}
                  />
                </div>

                {/* Файл логотипа */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--gray-700)',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    Логотип (файл)
                  </label>
                  <div style={{
                    border: '2px dashed rgba(7, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(7, 185, 129, 0.05)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#07B981';
                    e.target.style.background = 'rgba(7, 185, 129, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(7, 185, 129, 0.3)';
                    e.target.style.background = 'rgba(7, 185, 129, 0.05)';
                  }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
                      style={{
                        display: 'none'
                      }}
                      id="logo-file"
                    />
                    <label htmlFor="logo-file" style={{ cursor: 'pointer', color: '#07B981' }}>
                      📎 Выберите файл логотипа
                    </label>
                    <div style={{ color: '#ffffff', fontSize: '12px', marginTop: '4px' }}>
                      PNG, JPG до 5MB
                    </div>
                  </div>
                </div>
              </div>

          {/* Кнопки действий */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(7, 185, 129, 0.2)'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(107, 114, 128, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
              }}
            >
              ❌ Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: saving ? 'rgba(7, 185, 129, 0.6)' : 'linear-gradient(135deg, #07B981 0%, #34d399 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(7, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(7, 185, 129, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(7, 185, 129, 0.4)';
                }
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTopColor: '#ffffff',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  💾 Сохранение...
                </>
              ) : (
                <>
                  ✅ Сохранить партнера
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


