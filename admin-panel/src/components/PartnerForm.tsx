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
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || '')
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.cover_image_url || '')
  const [cityId, setCityId] = useState<number>(initial?.city_id ?? 1)
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(initial?.max_discount_percent ?? 20)
  const [address, setAddress] = useState(initial?.address || '')
  const [twoGisUrl, setTwoGisUrl] = useState(initial?.two_gis_url || 'https://2gis.kg/bishkek')
  const [email, setEmail] = useState(initial?.email || '')
  const [cashbackRate, setCashbackRate] = useState<number>(initial?.cashback_rate ?? 5)
  const [website, setWebsite] = useState(initial?.website || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload: PartnerInput = {
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
        ...(cashbackRate !== undefined && { cashback_rate: Number(cashbackRate) }),
        ...(website && { website: website.trim() })
      }
      await onSave(payload, imageFile)
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения')
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

        {error && <div style={{ marginBottom: 12, color: '#ef4444' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: '1 1 320px', minWidth: 240 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Название партнера *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Введите название партнера" className="input" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 240 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Категория *</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Например: Рестораны, Магазины" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 240 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Телефон *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+996 XXX XXX XXX" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 240 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Пароль *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 8 символов" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Адрес *</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Полный адрес партнера" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Ссылка 2GIS</label>
              <input value={twoGisUrl} onChange={e => setTwoGisUrl(e.target.value)} placeholder="https://2gis.kg/..." style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>
            <div style={{ flex: '1 1 240px', minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Веб-сайт</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://partner-website.com" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>Описание партнера</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробное описание партнера..." style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)', minHeight: 100 }} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>URL логотипа</label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>
            <div style={{ flex: '1 1 240px', minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--gray-700)', fontWeight: 600 }}>URL обложки</label>
              <input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://example.com/cover.jpg" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-900)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button type="button" className="button" onClick={onCancel} style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-300)' }}>Отмена</button>
            <button type="submit" className="button" disabled={saving} style={{ background: 'var(--accent)', color: 'var(--white)', opacity: saving ? 0.6 : 1 }}>{saving ? 'Сохранение...' : 'Сохранить партнера'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        background: 'var(--white)',
                        color: 'var(--gray-900)',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        background: 'var(--white)',
                        color: 'var(--gray-900)',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        background: 'var(--white)',
                        color: 'var(--gray-900)',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        background: 'var(--white)',
                        color: 'var(--gray-900)',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        background: 'var(--white)',
                        color: 'var(--gray-900)',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        background: 'var(--white)',
                        color: 'var(--gray-900)',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                      borderRadius: '8px',
                      border: '1px solid var(--gray-300)',
                      background: 'var(--white)',
                      color: 'var(--gray-900)',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                      borderRadius: '8px',
                      border: '1px solid var(--gray-300)',
                      background: 'var(--white)',
                      color: 'var(--gray-900)',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
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
                    border: '2px dashed var(--gray-300)',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'var(--gray-50)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.background = 'var(--gray-100)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--gray-300)';
                    e.target.style.background = 'var(--gray-50)';
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
                    <label htmlFor="logo-file" style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: '500' }}>
                      📎 Выберите файл логотипа
                    </label>
                    <div style={{ color: 'var(--gray-500)', fontSize: '12px', marginTop: '4px' }}>
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
              {saving ? 'Сохранение...' : 'Сохранить партнера'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


