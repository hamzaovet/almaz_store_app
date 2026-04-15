'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, GitBranch, Loader2, MapPin } from 'lucide-react'

interface Branch {
  _id: string
  name: string
  address?: string
  createdAt: string
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [form, setForm]         = useState({ _id: '', name: '', address: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/branches')
      const data = await res.json()
      setBranches(data.branches ?? [])
    } catch { showToast('فشل تحميل الفروع', 'err') }
    finally { setLoading(false) }
  }

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function openNew() {
    setIsEditing(false)
    setForm({ _id: '', name: '', address: '' })
    setModal(true)
  }

  function openEdit(b: Branch) {
    setIsEditing(true)
    setForm({ _id: b._id, name: b.name, address: b.address ?? '' })
    setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = isEditing ? 'PUT' : 'POST'
      const body   = isEditing
        ? { _id: form._id, name: form.name.trim(), address: form.address.trim() }
        : { name: form.name.trim(), address: form.address.trim() }
      const res  = await fetch('/api/branches', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showToast(isEditing ? 'تم تحديث الفرع ✓' : 'تم إضافة الفرع ✓', 'ok')
      setModal(false)
      load()
    } catch (err: any) {
      showToast(err.message ?? 'حدث خطأ', 'err')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return
    try {
      await fetch(`/api/branches?id=${id}`, { method: 'DELETE' })
      showToast('تم حذف الفرع', 'ok')
      setBranches(prev => prev.filter(b => b._id !== id))
    } catch { showToast('فشل الحذف', 'err') }
  }

  /* ── Styles ───────────────────────────────────────────────── */
  const panel: React.CSSProperties = {
    background: '#111111', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', color: '#FFFFFF',
    outline: 'none', background: 'rgba(255,255,255,0.04)', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    display: 'block', marginBottom: '0.3rem', letterSpacing: '0.05em',
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>إدارة المواقع</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF' }}>الفروع والمستودعات</h1>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(14,165,233,0.35)' }}
        >
          <Plus size={18} /> إضافة فرع
        </button>
      </div>

      {/* Branches List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
        </div>
      ) : branches.length === 0 ? (
        <div style={{ ...panel, padding: '4rem', textAlign: 'center' }}>
          <GitBranch size={42} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>لا توجد فروع بعد — أضف أول فرع الآن</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {branches.map((b) => (
            <div key={b._id} style={{ ...panel, padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={20} color="#0ea5e9" />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem', marginBottom: '0.15rem' }}>{b.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>{b.address || 'لا يوجد عنوان'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(b)} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 9, padding: '0.5rem', cursor: 'pointer', color: '#0ea5e9', display: 'flex' }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(b._id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '0.5rem', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div style={{ background: '#0a0a0a', borderRadius: 22, width: '100%', maxWidth: 460, padding: '2rem', border: '1px solid rgba(14,165,233,0.25)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>
                {isEditing ? 'تعديل الفرع' : 'إضافة فرع جديد'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 50, padding: '0.35rem', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>اسم الفرع *</label>
                <input
                  required autoFocus type="text"
                  placeholder="المتجر الرئيسي، الفرع الأول…"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>العنوان (اختياري)</label>
                <input
                  type="text"
                  placeholder="القاهرة، المعادي…"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={inp}
                />
              </div>
              <button
                type="submit" disabled={saving || !form.name.trim()}
                style={{ background: saving || !form.name.trim() ? 'rgba(14,165,233,0.3)' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.9rem', fontWeight: 800, fontSize: '1rem', cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={18} />}
                {isEditing ? 'حفظ التعديلات' : 'إضافة الفرع'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
