import React, { useEffect, useState } from 'react'
import { fetchPartners, createPartner, updatePartner, deletePartner, uploadPartnerImage,
  fetchPartnerProducts, createPartnerProduct, deletePartnerProduct, uploadPartnerProductImage, updatePartnerProduct } from '../api/client'
import ProductForm from '../components/ProductForm'
import PartnerProductsPanel from '../components/PartnerProductsPanel'
import PartnerForm from '../components/PartnerForm'
import ConfirmDialog from '../components/ConfirmDialog'

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: 'var(--gray-900)', textShadow: 'none', marginBottom: '24px' }}>Партнеры</h2>
        <button className="button" onClick={handleCreate}>Новый партнер</button>
      </div>
      <div className="card">
        {loading && <div className="muted">Loading...</div>}
        {error && <div style={{ color: '#ff7b7b' }}>{error}</div>}
        {!loading && partners.length === 0 && <div className="muted">No partners found</div>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {partners.map(p => (
            <li key={String(p.id)} style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{p.name}</strong>
                <div className="muted" style={{ fontSize: 13 }}>{p.description}</div>
              </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="button" onClick={() => handleEdit(p)}>Изменить</button>
                <button className="button" onClick={() => handleDelete(p)} style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }}>Удалить</button>
              </div>
            <PartnerProductsPanel partnerId={p.id} />
            </li>
          ))}
        </ul>
      </div>

      {creating && <PartnerForm onCancel={() => setCreating(false)} onSave={handleSave} />}
      {editing && <PartnerForm initial={editing as any} onCancel={() => setEditing(null)} onSave={handleSave} />}
      {deleting && <ConfirmDialog title="Удалить партнера" message={`Удалить "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={performDelete} />}
      {/* Simple Partner Products Section */}
      {partners.map((p) => (
        <div key={String(p.id)} style={{ marginTop: 12, padding: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Manage products for {p.name}</strong>
            </div>
            <button className="button" onClick={() => toggleProductsFor(p.id)} style={{ marginLeft: 8 }}>
              {expandedPartnerIds.includes(p.id) ? 'Hide' : 'Show'} products
            </button>
          </div>
          {expandedPartnerIds.includes(p.id) && (
            <div style={{ marginTop: 8 }}>
              <div className="card" style={{ padding: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Product name" value={newProductDraft.name || ''} onChange={e => setNewProductDraft((d) => ({ ...d, name: e.target.value, partnerId: p.id }))} style={{ flex: 1, padding: 6 }} />
                  <button className="button" onClick={async () => {
                    const payload = { name: newProductDraft.name, description: newProductDraft.description, price: newProductDraft.price ? Number(newProductDraft.price) : undefined }
                    try {
                      const created = await createPartnerProduct(p.id, { ...payload, sku: newProductDraft.sku, stock: newProductDraft.stock ? Number(newProductDraft.stock) : undefined, category: newProductDraft.category })
                      const pid = created?.id
                      if (newProductDraft.image && pid != null) {
                        await uploadPartnerProductImage(p.id, pid, newProductDraft.image)
                      }
                      await fetchPartnerProducts(p.id).then((data) => {
                        setPartnerProducts((prev) => ({ ...prev, [p.id]: Array.isArray(data) ? data : data.items || data.data || [] }))
                      })
                      setNewProductDraft({})
                    } catch (err) {
                      // optional: show error via toast
                    }
                  }}>Add</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input placeholder="Description" value={newProductDraft.description || ''} onChange={e => setNewProductDraft(d => ({ ...d, description: e.target.value }))} style={{ flex: 2, padding: 6 }} />
                  <input placeholder="Price" value={newProductDraft.price || ''} onChange={e => setNewProductDraft(d => ({ ...d, price: e.target.value }))} style={{ width: 150, padding: 6 }} />
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0] || null
                    setNewProductDraft(d => ({ ...d, image: file || undefined }))
                  }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
              {(partnerProducts[p.id] || []).map((pp: any) => (
                <div key={pp.id} style={{ padding: 6, borderBottom: '1px solid rgba(0,0,0,.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{pp.name}</strong> - <span className="muted" style={{ fontSize: 12 }}>{pp.description}</span>
                    </div>
                    <button className="button" onClick={() => setEditingProduct({ partnerId: p.id, id: pp.id, name: pp.name, description: pp.description, price: pp.price, sku: pp.sku, stock: pp.stock, category: pp.category })}>Edit</button>
                  </div>
                  <div style={{ fontSize: 12 }}>${pp.price ?? ''}</div>
                  {editingProduct && editingProduct.partnerId===p.id && editingProduct.id===pp.id && (
                    <ProductForm
                      initial={editingProduct}
                      onCancel={() => setEditingProduct(null)}
                      onSave={async (payload, image) => {
                        const partnerId = p.id
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
                        setPartnerProducts((prev) => ({ ...prev, [partnerId]: Array.isArray(data) ? data : data.items || data.data || [] }))
                        setEditingProduct(null)
                      }}
                    />
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


