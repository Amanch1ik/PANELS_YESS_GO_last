import React, { useState } from 'react'

type ProductInput = {
  id?: string | number
  name: string
  description?: string
  price?: number
  sku?: string
  stock?: number
  category?: string
}

export default function ProductForm({ initial, onCancel, onSave }: {
  initial?: ProductInput
  onCancel: () => void
  onSave: (payload: ProductInput, imageFile?: File | null) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [price, setPrice] = useState<number | undefined>(initial?.price)
  const [sku, setSku] = useState<string | undefined>(initial?.sku)
  const [stock, setStock] = useState<number | undefined>(initial?.stock)
  const [category, setCategory] = useState<string | undefined>(initial?.category)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSave({ id: initial?.id, name, description, price, sku, stock, category }, imageFile)
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80
    }}>
      <div className="card" style={{ width: 560 }}>
        <h3>{initial ? 'Edit Product' : 'New Product'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">Price</label>
            <input type="number" value={price ?? ''} onChange={e => setPrice(parseFloat(e.target.value))} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">SKU</label>
            <input value={sku ?? ''} onChange={e => setSku(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">Stock</label>
            <input type="number" value={stock ?? ''} onChange={e => setStock(e.target.value ? Number(e.target.value) : undefined)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">Category</label>
            <input value={category ?? ''} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="muted">Image</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'block', marginTop: 6 }} />
          </div>
          {error && <div style={{ color: '#ff7b7b', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="button" onClick={onCancel} style={{ background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }}>Отмена</button>
            <button type="submit" className="button" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}


