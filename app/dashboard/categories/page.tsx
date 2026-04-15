'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, X, Search, Loader2 } from 'lucide-react'

type Category = {
  _id?: string
  name: string
  slug: string
  icon: string
  description: string
}

const blankForm = { _id: '', name: '', slug: '', icon: '', description: '' }

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setItems(data.categories ?? [])
    } catch {
      showToast('فشل تحميل الأقسام', 'err')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function openNew() {
    setIsEditing(false)
    setForm(blankForm)
    setModal(true)
  }

  function openEdit(c: Category) {
    setIsEditing(true)
    setForm({
      _id: c._id ?? '',
      name: c.name ?? '',
      slug: c.slug ?? '',
      icon: c.icon ?? '',
      description: c.description ?? '',
    })
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim() || !form.icon.trim()) {
      showToast('يرجى تعبئة الحقول الأساسية', 'err')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        icon: form.icon.trim(),
        description: form.description.trim(),
        ...(isEditing ? { _id: form._id } : {})
      }

      const res = await fetch('/api/categories', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'فشل الحفظ')

      if (isEditing) {
        setItems(prev => prev.map(c => c._id === form._id ? data.data : c))
        showToast('تم التحديث بنجاح', 'ok')
      } else {
        setItems(prev => [data.category, ...prev])
        showToast('تمت الإضافة بنجاح', 'ok')
      }
      setModal(false)
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(c => c._id !== id))
      showToast('تم حذف القسم', 'ok')
    } catch {
      showToast('فشل حذف القسم', 'err')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = items.filter(c => c.name.includes(search) || c.slug.includes(search))

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: '1.75rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(29,29,31,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', border: '1px solid rgba(29,29,31,0.14)', borderRadius: 10,
    fontSize: '0.92rem', fontFamily: 'inherit', color: '#111', outline: 'none', background: '#fafafa', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem',
  }
  const field = (children: React.ReactNode) => <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>الأقسام الديناميكية</p>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#111' }}>إدارة الأقسام</h1>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.72rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={18} strokeWidth={2.5} /> إضافة قسم جديد
        </button>
      </div>

      <div style={{ ...card, marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(29,29,31,0.35)' }} />
          <input type="text" placeholder="بحث بالاسم أو المعرف…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, paddingRight: '2.25rem' }} />
        </div>
      </div>

      <div style={{ ...card, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(29,29,31,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(14,165,233,0.15)' }}>
                {['القسم', 'المعرف (Slug)', 'الأيقونة', 'إجراءات'].map((h) => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'rgba(29,29,31,0.5)', fontSize: '0.78rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid rgba(29,29,31,0.05)' }}>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#111' }}>{c.name}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#0ea5e9', direction: 'ltr', textAlign: 'right' }}>{c.slug}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#111' }}>{c.icon}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(c)} style={{ background: 'rgba(14,165,233,0.1)', border: 'none', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#0ea5e9' }}><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(c._id!)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#111' }}>{isEditing ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {field(<>
                <label style={lbl}>اسم القسم *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} style={inp} />
              </>)}
              {field(<>
                <label style={lbl}>المعرف (Slug) انجليزي *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} style={{...inp, direction: 'ltr'}} placeholder="e.g. mobiles" />
              </>)}
              {field(<>
                <label style={lbl}>اسم الأيقونة (Lucide Icon) *</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} style={{...inp, direction: 'ltr'}} placeholder="e.g. Smartphone" />
              </>)}
              {field(<>
                <label style={lbl}>الوصف (اختياري)</label>
                <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} style={inp} />
              </>)}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {saving ? <><Loader2 size={16} /> جاري الحفظ...</> : (isEditing ? 'تحديث' : 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111', marginBottom: '0.5rem' }}>تأكيد الحذف</h3>
            <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>لا يمكن التراجع عن هذا الإجراء.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>حذف</button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'rgba(29,29,31,0.06)', color: '#111', border: 'none', borderRadius: 10, padding: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
