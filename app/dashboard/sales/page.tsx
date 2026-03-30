'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle, Plus, Loader2, Banknote, X } from 'lucide-react'

type ApiProduct = {
  _id: string
  name: string
  category: string
  price: number
  stock: number
}

type Sale = {
  _id: string
  customer: string
  phone: string
  date: string
  productName: string
  price: number
  actualSalePrice?: number
  qty: number
  total: number
}

export default function SalesPage() {
  const [sales, setSales]         = useState<Sale[]>([])
  const [products, setProducts]   = useState<ApiProduct[]>([])
  const [loadingSales, setLoadingSales]       = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting]           = useState(false)
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [form, setForm] = useState({
    customer:  '',
    phone:     '',
    date:      new Date().toISOString().split('T')[0],
    productId: '',
    actualSalePrice: '',
    qty:       '1',
  })

  const [expenseModal, setExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm]   = useState({ title: '', amount: '' })
  const [savingExpense, setSavingExpense] = useState(false)

  /* ── Data fetching ──────────────────────────────────────── */
  useEffect(() => { fetchSales();  fetchProducts() }, [])

  async function fetchSales() {
    setLoadingSales(true)
    try {
      const res  = await fetch('/api/sales')
      const data = await res.json()
      setSales(data.sales ?? [])
    } catch {
      showToast('فشل تحميل المبيعات', 'err')
    } finally {
      setLoadingSales(false)
    }
  }

  async function fetchProducts() {
    setLoadingProducts(true)
    try {
      const res  = await fetch('/api/products')
      const data = await res.json()
      const list: ApiProduct[] = data.products ?? []
      setProducts(list)
      // Pre-select first product
      if (list.length > 0) setForm((f) => ({ ...f, productId: list[0]._id, actualSalePrice: String(list[0].price) }))
    } catch {
      showToast('فشل تحميل المنتجات', 'err')
    } finally {
      setLoadingProducts(false)
    }
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const selectedProduct = products.find((p) => p._id === form.productId)
  const totalRevenue    = sales.reduce((s, e) => s + (e.total ?? e.price * e.qty), 0)

  /* ── Submit sale → POST /api/sales ──────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer || !selectedProduct || !form.actualSalePrice) return
    setSubmitting(true)
    try {
      const res  = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer:    form.customer,
          phone:       form.phone,
          date:        form.date,
          productId:   selectedProduct._id,
          productName: selectedProduct.name,
          price:       selectedProduct.price,
          actualSalePrice: form.actualSalePrice,
          qty:         Number(form.qty),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message)

      // Prepend new sale & reset form
      setSales((prev) => [data.sale, ...prev])
      setForm({ customer: '', phone: '', date: new Date().toISOString().split('T')[0], productId: products[0]?._id ?? '', actualSalePrice: products[0] ? String(products[0].price) : '', qty: '1' })

      // Reflect stock decrement locally so the preview stays accurate
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, stock: Math.max(0, p.stock - Number(form.qty)) }
            : p
        )
      )
      showToast('✓ تم تسجيل البيع وتحديث المخزون', 'ok')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Submit Expense → POST /api/expenses ────────────────── */
  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.title || !expenseForm.amount) return
    setSavingExpense(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('تم تسجيل المصروف بنجاح ✓', 'ok')
      setExpenseModal(false)
      setExpenseForm({ title: '', amount: '' })
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSavingExpense(false)
    }
  }

  /* ── Styles ─────────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: '1.75rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(29,29,31,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', border: '1px solid rgba(29,29,31,0.14)',
    borderRadius: 10, fontSize: '0.92rem', fontFamily: 'inherit', color: '#1D1D1F',
    outline: 'none', background: '#fafafa', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)',
    display: 'block', marginBottom: '0.3rem',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>إدارة المبيعات والمصروفات</p>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>سجل العمليات</h1>
          <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            تسجيل البيع يخصم الكمية تلقائياً من المخزون
          </p>
        </div>
        <button onClick={() => setExpenseModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '0.72rem 1.4rem', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(239, 68, 68, 0.25)' }}>
          <Banknote size={18} strokeWidth={2.5} />
          إضافة مصروف
        </button>
      </div>

      {/* KPIs — derived from real sales state */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString('ar-EG')} ج.م`, color: '#D4AF37' },
          { label: 'عدد العمليات',     value: `${sales.length} عملية`,                                       color: '#6366f1' },
          { label: 'وحدات مباعة',      value: `${sales.reduce((s, e) => s + e.qty, 0)} وحدة`,                color: '#22c55e' },
        ].map((k) => (
          <div key={k.label} style={{ ...card, padding: '1.2rem 1.4rem' }}>
            <p style={{ fontSize: '0.74rem', fontWeight: 600, color: 'rgba(29,29,31,0.45)', marginBottom: '0.4rem' }}>{k.label}</p>
            <p style={{ fontSize: '1.35rem', fontWeight: 900, color: k.color, direction: 'ltr', textAlign: 'right' }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Record Sale Form ──────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="#D4AF37" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1D1D1F' }}>تسجيل عملية بيع</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'اسم العميل', key: 'customer', type: 'text',   placeholder: 'أحمد محمد' },
              { label: 'رقم الهاتف', key: 'phone',    type: 'tel',    placeholder: '010xxxxxxxx' },
              { label: 'التاريخ',    key: 'date',     type: 'date',   placeholder: '' },
            ].map((f) => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input
                  required
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inp}
                />
              </div>
            ))}

            {/* Product selector — loaded from API */}
            <div>
              <label style={lbl}>المنتج</label>
              {loadingProducts ? (
                <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(29,29,31,0.4)' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
                </div>
              ) : products.length === 0 ? (
                <div style={{ ...inp, color: 'rgba(29,29,31,0.4)', cursor: 'default' }}>
                  لا توجد منتجات — أضف منتجاً أولاً
                </div>
              ) : (
                <select 
                  value={form.productId} 
                  onChange={(e) => {
                    const p = products.find(prod => prod._id === e.target.value);
                    setForm({ ...form, productId: e.target.value, actualSalePrice: p ? String(p.price) : '' })
                  }} 
                  style={inp}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — السعر الأصلي: {p.price.toLocaleString('ar-EG')} ج.م
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={lbl}>سعر البيع الفعلي (ج.م)</label>
              <input
                required
                type="number"
                placeholder="0"
                value={form.actualSalePrice}
                onChange={(e) => setForm({ ...form, actualSalePrice: e.target.value })}
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>الكمية</label>
              <input
                required
                type="number"
                min="1"
                placeholder="1"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                style={inp}
              />
            </div>

            {/* Stock impact preview */}
            {selectedProduct && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: selectedProduct.stock < +form.qty ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${selectedProduct.stock < +form.qty ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.22)'}`, borderRadius: 10, padding: '0.7rem 1rem' }}>
                <AlertCircle size={16} color={selectedProduct.stock < +form.qty ? '#dc2626' : '#d97706'} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.77rem', fontWeight: 700, color: selectedProduct.stock < +form.qty ? '#dc2626' : '#d97706' }}>
                    {selectedProduct.stock < +form.qty ? 'تحذير: الكمية تتجاوز المخزون!' : 'تأثير على المخزون'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(29,29,31,0.6)', marginTop: '0.1rem' }}>
                    المتاح: {selectedProduct.stock} → سيصبح: {Math.max(0, selectedProduct.stock - +form.qty)}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || products.length === 0 || (selectedProduct ? selectedProduct.stock < +form.qty : false)}
              style={{ background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.75 : 1 }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التسجيل…</>
                : <><TrendingUp size={17} /> تسجيل البيع</>}
            </button>
          </form>
        </div>

        {/* ── Sales history table ───────────────────────────── */}
        <div style={{ ...card, overflowX: 'auto' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1D1D1F', marginBottom: '1.25rem' }}>آخر العمليات</h2>
          {loadingSales ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(29,29,31,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
            </div>
          ) : sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(29,29,31,0.35)' }}>
              لا توجد مبيعات بعد — سجّل أول عملية بيع
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.12)' }}>
                  {['العميل', 'الهاتف', 'المنتج', 'سعر البيع', 'الكمية', 'التاريخ'].map((h) => (
                    <th key={h} style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontWeight: 700, color: 'rgba(29,29,31,0.45)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid rgba(29,29,31,0.05)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fafafa')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}>
                    <td style={{ padding: '0.85rem', fontWeight: 700, color: '#1D1D1F' }}>{s.customer}</td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.55)', direction: 'ltr', textAlign: 'right' }}>{s.phone}</td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.7)' }}>{s.productName}</td>
                    <td style={{ padding: '0.85rem', fontWeight: 700, color: '#D4AF37', direction: 'ltr', whiteSpace: 'nowrap' }}>
                      {(s.total ?? (s.actualSalePrice ? s.actualSalePrice * s.qty : s.price * s.qty)).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.6)', textAlign: 'center' }}>{s.qty}</td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.45)', direction: 'ltr', whiteSpace: 'nowrap' }}>{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expense Modal */}
      {expenseModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpenseModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1D1D1F' }}>إضافة مصروف جديد</h2>
              <button onClick={() => setExpenseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D1D1F' }}><X size={22} /></button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>عنوان المصروف</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: فاتورة كهرباء، أدوات تغليف، شحن..."
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>قيمة المصروف (ج.م)</label>
                <input
                  required
                  type="number"
                  placeholder="0"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  style={inp}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={savingExpense}
                  style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: savingExpense ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: savingExpense ? 0.75 : 1 }}
                >
                  {savingExpense
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جاري الحفظ…</>
                    : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
