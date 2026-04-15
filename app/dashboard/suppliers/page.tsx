'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Search, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

type SupplierType = 'Supplier' | 'Customer' | 'Both'

type Supplier = {
  _id?: string
  name: string
  type: SupplierType
  balance: number
  phone?: string
}

const blankForm: { _id: string; name: string; type: SupplierType; balance: string; phone: string } = {
  _id: '',
  name: '',
  type: 'Supplier',
  balance: '0',
  phone: '',
}

/* ── Balance badge ─────────────────────────────────────────── */
function BalanceBadge({ balance }: { balance: number }) {
  const isCredit  = balance > 0
  const isDebit   = balance < 0
  const color     = isCredit ? '#f59e0b' : isDebit ? '#ef4444' : '#22c55e'
  const bg        = isCredit ? 'rgba(245,158,11,0.1)' : isDebit ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'
  const Icon      = isCredit ? TrendingUp : isDebit ? TrendingDown : Wallet
  const label     = isCredit ? 'مدين (علينا)' : isDebit ? 'دائن (له)' : 'مسوّى'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.75rem', borderRadius: 50, background: bg, color, fontWeight: 700, fontSize: '0.78rem' }}>
      <Icon size={13} strokeWidth={2.5} />
      {Math.abs(balance).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
      &nbsp;—&nbsp;{label}
    </span>
  )
}

/* ── Type badge ────────────────────────────────────────────── */
function TypeBadge({ type }: { type: SupplierType }) {
  const map: Record<SupplierType, { label: string; color: string; bg: string }> = {
    Supplier: { label: 'مورد',       color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    Customer: { label: 'عميل',       color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    Both:     { label: 'مورد/عميل', color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  }
  const { label, color, bg } = map[type] ?? map.Supplier
  return (
    <span style={{ padding: '0.22rem 0.65rem', borderRadius: 50, background: bg, color, fontWeight: 700, fontSize: '0.75rem' }}>{label}</span>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function SuppliersPage() {
  const [items, setItems]       = useState<Supplier[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm]         = useState({ ...blankForm })
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  useEffect(() => { fetchSuppliers() }, [])

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const res  = await fetch('/api/suppliers')
      const data = await res.json()
      setItems(data.suppliers ?? [])
    } catch {
      showToast('فشل تحميل الموردين', 'err')
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
    setForm({ ...blankForm })
    setModal(true)
  }

  function openEdit(s: Supplier) {
    setIsEditing(true)
    setForm({
      _id: s._id ?? '',
      name: s.name,
      type: s.type,
      balance: String(s.balance),
      phone: s.phone ?? '',
    })
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('اسم الحساب مطلوب', 'err'); return }
    setSaving(true)
    try {
      const body = {
        name:    form.name.trim(),
        type:    form.type,
        balance: Number(form.balance) || 0,
        phone:   form.phone.trim() || undefined,
        ...(isEditing ? { _id: form._id } : {}),
      }

      const res  = await fetch('/api/suppliers', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'فشل الحفظ')

      if (isEditing) {
        setItems(prev => prev.map(s => s._id === form._id ? { ...data.data } : s))
        showToast('تم التحديث بنجاح ✓', 'ok')
      } else {
        setItems(prev => [data.supplier, ...prev])
        showToast('تمت إضافة الحساب ✓', 'ok')
      }
      setModal(false)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(s => s._id !== id))
      showToast('تم الحذف', 'ok')
    } catch {
      showToast('فشل الحذف', 'err')
    } finally {
      setDeleteId(null)
    }
  }

  /* ── Totals ──────────────────────────────────────────────── */
  // balance > 0  => store owes THEM  => "مستحق علينا"
  // balance < 0  => they owe US      => "مستحق لنا"
  const totalOwedByUs  = items.filter(s => s.balance > 0).reduce((acc, s) => acc + s.balance, 0)
  const totalOwedToUs  = items.filter(s => s.balance < 0).reduce((acc, s) => acc + Math.abs(s.balance), 0)
  const filtered     = items.filter(s => s.name.includes(search) || (s.phone ?? '').includes(search))

  /* ── Styles ──────────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#111111', borderRadius: 16, padding: '1.75rem',
    border: '1px solid rgba(255,255,255,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.68rem 0.9rem', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, fontSize: '0.92rem', fontFamily: 'inherit', color: '#FFFFFF',
    outline: 'none', background: 'rgba(255,255,255,0.04)', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
    display: 'block', marginBottom: '0.3rem',
  }
  const field = (children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>دفتر الحسابات</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF' }}>الموردون والعملاء</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', marginTop: '0.2rem' }}>{items.length} حساب في قاعدة البيانات</p>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.72rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(14,165,233,0.35)' }}
        >
          <Plus size={18} strokeWidth={2.5} /> إضافة حساب جديد
        </button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'إجمالي المستحق (لنا)',    value: totalOwedToUs,   color: '#22c55e', icon: TrendingUp },
          { label: 'إجمالي المستحق (علينا)',   value: totalOwedByUs,   color: '#ef4444', icon: TrendingDown },
          { label: 'إجمالي الحسابات',          value: items.length, color: '#0ea5e9', icon: Wallet, isCount: true },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={s.color} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.25rem' }}>{s.label}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', direction: s.isCount ? 'inherit' : 'ltr', lineHeight: 1 }}>
                  {s.isCount
                    ? s.value
                    : s.value.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) + ' ج.م'
                  }
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Search ────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text" placeholder="بحث بالاسم أو رقم الهاتف…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inp, paddingRight: '2.25rem' }}
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div style={{ ...card, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(14,165,233,0.12)' }}>
                {['#', 'الاسم', 'النوع', 'الرصيد', 'الهاتف', 'إجراءات'].map((h) => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s._id ?? i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '0.9rem 1rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>{s.name}</td>
                  <td style={{ padding: '0.9rem 1rem' }}><TypeBadge type={s.type} /></td>
                  <td style={{ padding: '0.9rem 1rem' }}><BalanceBadge balance={s.balance} /></td>
                  <td style={{ padding: '0.9rem 1rem', color: 'rgba(255,255,255,0.5)', direction: 'ltr', textAlign: 'right' }}>{s.phone || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(s)} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#0ea5e9', display: 'flex', alignItems: 'center' }}><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(s._id!)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)' }}>لا توجد نتائج</div>
        )}
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────── */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div style={{ background: '#0a0a0a', borderRadius: 20, width: '100%', maxWidth: 480, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>
                {isEditing ? 'تعديل الحساب' : 'إضافة حساب جديد'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 50, padding: '0.35rem', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {field(<>
                <label style={lbl}>الاسم *</label>
                <input type="text" placeholder="اسم المورد أو العميل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
              </>)}
              {field(<>
                <label style={lbl}>النوع *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SupplierType })} style={inp}>
                  <option value="Supplier">مورد (Supplier)</option>
                  <option value="Customer">عميل (Customer)</option>
                  <option value="Both">مورد وعميل (Both)</option>
                </select>
              </>)}
              {field(<>
                <label style={lbl}>الرصيد الافتراضي (ج.م)</label>
                <input type="number" placeholder="0.00" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} style={{ ...inp, direction: 'ltr' }} />
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>موجب = مديون علينا (دائن) — سالب = دائن له (مدين)</p>
              </>)}
              {field(<>
                <label style={lbl}>رقم الهاتف (اختياري)</label>
                <input type="text" placeholder="+20…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ ...inp, direction: 'ltr' }} />
              </>)}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button
                onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.75 : 1 }}
              >
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ…</> : (isEditing ? 'حفظ التعديلات' : 'إضافة الحساب')}
              </button>
              <button onClick={() => setModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '2rem', maxWidth: 360, width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>تأكيد الحذف</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>لا يمكن التراجع عن هذا الإجراء.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>نعم، احذف</button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
