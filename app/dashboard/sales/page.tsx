'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Scan, Plus, X, Trash2, ShoppingCart, TrendingUp,
  Loader2, Banknote, CheckCircle2,
  Banknote as Cash, CreditCard, Building2, Zap, Smartphone,
  Package, User, Phone, Calendar, Download, MessageCircle,
} from 'lucide-react'
import { ImeiScanner } from '@/components/dashboard/ImeiScanner'
import { InvoiceTemplate, type InvoiceData } from '@/components/dashboard/InvoiceTemplate'
import { generateInvoicePDF, openWhatsApp } from '@/components/dashboard/invoiceUtils'

/* ── Types ──────────────────────────────────────────────────── */
type PaymentMethod = 'Cash' | 'Visa' | 'Valu' | 'InstaPay' | 'Vodafone Cash'

interface ApiProduct {
  _id: string
  name: string
  category: string
  price: number
  costPrice?: number
  stock: number
  imageUrl?: string
  serialNumber?: string
  storage?: string
  color?: string
  condition?: string
  isSerialized?: boolean
  location?: string
  branchId?: string
  ownershipType?: 'Owned' | 'Consignment'
}

interface CartItem {
  product:         ApiProduct
  qty:             number
  actualUnitPrice: number
  fulfillmentLocation: string
}

interface SaleRecord {
  _id: string
  customer: string
  phone?: string
  date: string
  invoiceNumber: string
  items: { productName: string; qty: number; actualUnitPrice: number }[]
  totalSalePrice: number
  profit: number
  paymentMethod: PaymentMethod
}

const PAYMENT_META: Record<PaymentMethod, { label: string; color: string; icon: React.ElementType }> = {
  'Cash':         { label: 'كاش',         color: '#22c55e', icon: Cash },
  'Visa':         { label: 'فيزا',         color: '#0ea5e9', icon: CreditCard },
  'Valu':         { label: 'ValU',         color: '#a855f7', icon: Building2 },
  'InstaPay':     { label: 'إنستاباي',    color: '#f59e0b', icon: Zap },
  'Vodafone Cash':{ label: 'فودافون كاش', color: '#ef4444', icon: Smartphone },
}

function fmt(n: number) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 2 })
}

/* ═══════════════════════════════════════════════════════════════ */
export default function SalesPage() {
  const [products,  setProducts]  = useState<ApiProduct[]>([])
  const [sales,     setSales]     = useState<SaleRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [cart,      setCart]      = useState<CartItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [checkoutModal, setCheckoutModal] = useState(false)
  const [successModal,  setSuccessModal]  = useState(false)
  const [expenseModal,  setExpenseModal]  = useState(false)
  const [completedSale, setCompletedSale] = useState<InvoiceData | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Customer form
  const [customer,      setCustomer]      = useState('')
  const [phone,         setPhone]         = useState('')
  const [date,          setDate]          = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')

  const [submitting,    setSubmitting]    = useState(false)
  const [expenseForm,   setExpenseForm]   = useState({ title: '', amount: '' })
  const [savingExpense, setSavingExpense] = useState(false)
  const [toast,         setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [search,        setSearch]        = useState('')
  const [dbBranches,    setDbBranches]    = useState<{_id: string, name: string}[]>([])

  /* ── Fetch ───────────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rP, rS, rB] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/branches'),
      ])
      const dP = await rP.json()
      const dS = await rS.json()
      const dB = await rB.json()
      setProducts(dP.products ?? [])
      setSales(dS.sales ?? [])
      setDbBranches(dB.branches ?? [])
    } catch {
      showToast('فشل تحميل البيانات', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /* ── Toast ───────────────────────────────────────────────── */
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── Cart logic ──────────────────────────────────────────── */
  function addToCart(product: ApiProduct) {
    if (product.stock <= 0) { showToast(`${product.name} — نفد من المخزون`, 'err'); return }
    const isSerial = product.isSerialized ?? Boolean(product.serialNumber)
    setCart(prev => {
      const existing = prev.find(i => i.product._id === product._id)
      if (existing) {
        // Serialized devices cannot be added twice
        if (isSerial) { showToast('الجهاز مسلسل — لا يمكن تكرار الإضافة', 'err'); return prev }
        // Non-serialized: simply increment qty
        return prev.map(i => i.product._id === product._id ? { ...i, qty: Math.min(i.qty + 1, product.stock) } : i)
      }
      return [...prev, { product, qty: 1, actualUnitPrice: product.price, fulfillmentLocation: typeof product.branchId === 'string' ? product.branchId : (product.branchId as any)?._id || '' }]
    })
    showToast(`تمت إضافة ${product.name} للسلة`, 'ok')
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.product._id !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) return
    setCart(prev => prev.map(i => i.product._id === productId ? { ...i, qty } : i))
  }

  function updatePrice(productId: string, price: number) {
    setCart(prev => prev.map(i => i.product._id === productId ? { ...i, actualUnitPrice: price } : i))
  }

  function updateLocation(productId: string, loc: string) {
    setCart(prev => prev.map(i => i.product._id === productId ? { ...i, fulfillmentLocation: loc } : i))
  }

  /* ── Radar scan handler ──────────────────────────────────── */
  function handleScan(serial: string) {
    setShowScanner(false)
    const found = products.find(p => p.serialNumber === serial)
    if (found) {
      addToCart(found)
      showToast(`✓ تم اكتشاف الجهاز: ${found.name}`, 'ok')
    } else {
      showToast(`الجهاز بسيريال ${serial} غير موجود في المخزون`, 'err')
    }
  }

  /* ── Cart totals ─────────────────────────────────────────── */
  const totalList  = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const totalSale  = cart.reduce((s, i) => s + i.actualUnitPrice * i.qty, 0)
  const totalCost  = cart.reduce((s, i) => s + (i.product.costPrice ?? 0) * i.qty, 0)
  const totalProfit = totalSale - totalCost
  const totalDiscount = totalList - totalSale

  /* ── Submit checkout ─────────────────────────────────────── */
  async function handleCheckout() {
    if (!customer.trim()) { showToast('اسم العميل مطلوب', 'err'); return }
    if (cart.length === 0) { showToast('السلة فارغة', 'err'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          phone,
          date,
          paymentMethod,
          totalListPrice: totalList,
          totalSalePrice: totalSale,
          totalCost: totalCost,
          profit: totalProfit,
          discount: totalDiscount,
          items: cart.map(i => ({
            productId:           i.product._id,
            productName:         i.product.name,
            serialNumber:        i.product.serialNumber,
            qty:                 i.qty,
            unitPrice:           i.product.price,
            actualUnitPrice:     i.actualUnitPrice,
            costAtSale:          i.product.costPrice ?? 0,
            fulfillmentLocation: i.fulfillmentLocation,
            ownershipType:       i.product.ownershipType ?? 'Owned',
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      const returnedSale = json.sale

      // Build InvoiceData from cart snapshot + API response
      const now = new Date()
      const invoiceData: InvoiceData = {
        invoiceNumber: String(returnedSale._id).slice(-6).toUpperCase(),
        date: now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        customer,
        phone: phone || undefined,
        paymentMethod,
        items: cart.map(i => ({
          productName:     i.product.name,
          serialNumber:    i.product.serialNumber,
          storage:         i.product.storage,
          color:           i.product.color,
          condition:       i.product.condition,
          qty:             i.qty,
          unitPrice:       i.product.price,
          actualUnitPrice: i.actualUnitPrice,
        })),
        totalListPrice:  totalList,
        totalSalePrice:  totalSale,
        discount:        totalDiscount,
        profit:          totalProfit,
      }

      setCompletedSale(invoiceData)
      setCheckoutModal(false)
      setSuccessModal(true)
      setCart([])
      setCustomer('')
      setPhone('')
      setPaymentMethod('Cash')
      await loadData()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Expense submit ──────────────────────────────────────── */
  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.title || !expenseForm.amount) return
    setSavingExpense(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('تم تسجيل المصروف ✓', 'ok')
      setExpenseModal(false)
      setExpenseForm({ title: '', amount: '' })
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSavingExpense(false)
    }
  }

  /* ── Filtered inventory ──────────────────────────────────── */
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.serialNumber ?? '').includes(search) ||
    (p.color ?? '').includes(search)
  ).filter(p => p.stock > 0) // only available

  /* ── Styles ─────────────────────────────────────────────── */
  const panel: React.CSSProperties = {
    background: '#111111', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, fontSize: '0.88rem', fontFamily: 'inherit', color: '#FFFFFF',
    outline: 'none', background: 'rgba(255,255,255,0.04)', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    display: 'block', marginBottom: '0.25rem', letterSpacing: '0.04em',
  }

  /* ── KPIs ────────────────────────────────────────────────── */
  const totalRevenue = sales.reduce((s, e) => s + (e.totalSalePrice ?? 0), 0)
  const totalProfitAll = sales.reduce((s, e) => s + (e.profit ?? 0), 0)

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>نقطة البيع المتكاملة</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF' }}>محرّك المبيعات</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={() => setExpenseModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '0.68rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Banknote size={16} /> إضافة مصروف
          </button>
          <button onClick={() => { setShowScanner(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 12, padding: '0.68rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Scan size={16} strokeWidth={2.5} /> مسح IMEI
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'إجمالي الإيرادات',  value: `${fmt(totalRevenue)} ج.م`,  color: '#0ea5e9' },
          { label: 'إجمالي الأرباح',    value: `${fmt(totalProfitAll)} ج.م`, color: '#22c55e' },
          { label: 'عدد الفواتير',       value: `${sales.length} فاتورة`,     color: '#a855f7' },
          { label: 'عناصر السلة',        value: `${cart.length} منتج`,         color: '#f59e0b' },
        ].map((k) => (
          <div key={k.label} style={{ ...panel, padding: '1.2rem 1.4rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>{k.label}</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 900, color: k.color, direction: 'ltr', textAlign: 'right' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main 3-column POS Layout ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Product Inventory Grid */}
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input
              type="text"
              placeholder="بحث بالاسم، السيريال، اللون…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inp}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ تحميل المخزون…
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '0.85rem' }}>
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  onClick={() => addToCart(p)}
                  style={{ ...panel, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none', borderColor: cart.some(c => c.product._id === p._id) ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(14,165,233,0.4)'; el.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = cart.some(c => c.product._id === p._id) ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.06)'; el.style.transform = 'translateY(0)' }}
                >
                  {/* Image or icon */}
                  <div style={{ height: 80, background: 'linear-gradient(135deg, #082f49, #0c4a6e)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', position: 'relative' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Package size={28} color="#0ea5e9" strokeWidth={1.5} />
                    )}
                    {/* Stock badge */}
                    <span style={{ position: 'absolute', top: 5, left: 5, background: p.stock > 5 ? 'rgba(34,197,94,0.85)' : 'rgba(245,158,11,0.85)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: 50 }}>
                      {(p.isSerialized ?? Boolean(p.serialNumber)) ? 'مسلسل' : `×${p.stock}`}
                    </span>
                    {/* Consignment badge */}
                    {p.ownershipType === 'Consignment' && (
                      <span style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(168,85,247,0.85)', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '0.12rem 0.38rem', borderRadius: 50 }}>أمانة</span>
                    )}
                    {/* In-cart indicator */}
                    {cart.some(c => c.product._id === p._id) && (
                      <div style={{ position: 'absolute', top: 5, right: 5, background: '#0ea5e9', borderRadius: 50, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={12} color="#fff" />
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  {(p.storage || p.color) && (
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>
                      {[p.storage, p.color].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {p.location && p.location !== 'Main Store' && (
                    <p style={{ fontSize: '0.65rem', color: '#f59e0b', marginBottom: '0.2rem', fontWeight: 700 }}>📍 {p.location}</p>
                  )}
                  <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0ea5e9', direction: 'ltr', textAlign: 'right' }}>{fmt(p.price)} ج.م</p>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)' }}>لا توجد منتجات متوفرة</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Cart + Checkout */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ ...panel, padding: '1.25rem' }}>
            {/* Cart header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <ShoppingCart size={18} color="#0ea5e9" />
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', flex: 1, margin: 0 }}>السلة</h2>
              <span style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', fontWeight: 800, fontSize: '0.78rem', padding: '0.15rem 0.55rem', borderRadius: 50 }}>{cart.length}</span>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Cart items */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.2)' }}>
                <ShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.85rem' }}>اضغط على منتج أو امسح IMEI</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 280, overflowY: 'auto', paddingLeft: '0.25rem' }}>
                {cart.map((item) => (
                  <div key={item.product._id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{item.product.name}</p>
                        {item.product.serialNumber && (
                          <p style={{ fontSize: '0.65rem', color: '#0ea5e9', direction: 'ltr' }}>{item.product.serialNumber}</p>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.product._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.1rem', flexShrink: 0 }}>
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Qty input — only for non-serialized */}
                      {!(item.product.isSerialized ?? Boolean(item.product.serialNumber)) && (
                        <input
                          type="number" min={1} max={item.product.stock}
                          value={item.qty}
                          onChange={(e) => updateQty(item.product._id, Number(e.target.value))}
                          style={{ ...inp, width: 52, textAlign: 'center', padding: '0.35rem 0.4rem', fontSize: '0.82rem' }}
                        />
                      )}
                      <input
                        type="number" step="0.01"
                        value={item.actualUnitPrice}
                        onChange={(e) => updatePrice(item.product._id, Number(e.target.value))}
                        style={{ ...inp, flex: 1, direction: 'ltr', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>ج.م</span>
                    </div>
                    {/* Location selector + ownership badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <select
                        value={item.fulfillmentLocation}
                        onChange={(e) => updateLocation(item.product._id, e.target.value)}
                        style={{ ...inp, padding: '0.25rem 0.5rem', fontSize: '0.7rem', flex: 1, color: '#ededed', background: '#111111', borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <option value="">المتجر الرئيسي (افتراضي)</option>
                        {dbBranches.map(loc => (
                          <option key={loc._id} value={loc._id} style={{ background: '#111111', color: '#ededed' }}>{loc.name}</option>
                        ))}
                      </select>
                      {item.product.ownershipType === 'Consignment' && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '0.2rem 0.5rem', borderRadius: 50, border: '1px solid rgba(168,85,247,0.3)', whiteSpace: 'nowrap' }}>
                          أمانة
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {cart.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(14,165,233,0.06)', borderRadius: 10, border: '1px solid rgba(14,165,233,0.15)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span>الخصم</span>
                    <span style={{ color: '#f59e0b', direction: 'ltr' }}>- {fmt(totalDiscount)} ج.م</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>الربح المتوقع</span>
                  <span style={{ color: totalProfit >= 0 ? '#22c55e' : '#ef4444', direction: 'ltr' }}>{fmt(totalProfit)} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#FFFFFF', fontSize: '1.05rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.15rem' }}>
                  <span>الإجمالي</span>
                  <span style={{ color: '#0ea5e9', direction: 'ltr' }}>{fmt(totalSale)} ج.م</span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={() => { if (cart.length === 0) { showToast('السلة فارغة', 'err'); return } setCheckoutModal(true) }}
              disabled={cart.length === 0}
              style={{ width: '100%', marginTop: '1rem', background: cart.length > 0 ? '#0ea5e9' : 'rgba(255,255,255,0.06)', color: cart.length > 0 ? '#fff' : 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, padding: '0.9rem', fontWeight: 800, fontSize: '1rem', cursor: cart.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: cart.length > 0 ? '0 4px 18px rgba(14,165,233,0.35)' : 'none', transition: 'all 0.2s' }}
            >
              <TrendingUp size={18} /> إتمام البيع
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Sales Table ───────────────────────────────── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>آخر الفواتير</h2>
        <div style={{ ...panel, overflowX: 'auto' }}>
          {sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.2)' }}>لا توجد مبيعات بعد</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(14,165,233,0.1)' }}>
                  {['#', 'العميل', 'المنتجات', 'إجمالي البيع', 'الربح', 'الدفع', 'التاريخ'].map(h => (
                    <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const pmeta = PAYMENT_META[s.paymentMethod]
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0ea5e9' }}>#{s.invoiceNumber}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>{s.customer}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.items?.map(i => i.productName).join(' + ') || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0ea5e9', direction: 'ltr', whiteSpace: 'nowrap' }}>{fmt(s.totalSalePrice ?? 0)} ج.م</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: (s.profit ?? 0) >= 0 ? '#22c55e' : '#ef4444', direction: 'ltr', whiteSpace: 'nowrap' }}>{fmt(s.profit ?? 0)} ج.م</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {pmeta && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: pmeta.color, fontWeight: 700, fontSize: '0.8rem', background: `${pmeta.color}15`, padding: '0.2rem 0.6rem', borderRadius: 50 }}>
                            {pmeta.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.35)', direction: 'ltr', whiteSpace: 'nowrap' }}>{s.date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Checkout Modal ───────────────────────────────────── */}
      {checkoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setCheckoutModal(false) }}
        >
          <div style={{ background: '#0a0a0a', borderRadius: 22, width: '100%', maxWidth: 500, padding: '2rem', border: '1px solid rgba(14,165,233,0.25)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>إتمام الفاتورة</h2>
              <button onClick={() => setCheckoutModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 50, padding: '0.35rem', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>

            {/* Customer info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={lbl}><User size={11} style={{ display: 'inline', marginLeft: '0.25rem' }} />اسم العميل *</label>
                <input type="text" placeholder="أحمد محمد" value={customer} onChange={(e) => setCustomer(e.target.value)} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={lbl}><Phone size={11} style={{ display: 'inline', marginLeft: '0.25rem' }} />الهاتف</label>
                  <input type="tel" placeholder="010xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}><Calendar size={11} style={{ display: 'inline', marginLeft: '0.25rem' }} />التاريخ</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
                </div>
              </div>
            </div>

            {/* Payment method — MANDATORY */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ ...lbl, marginBottom: '0.5rem', fontSize: '0.8rem', color: '#0ea5e9' }}>طريقة الدفع * (مطلوبة)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {(Object.entries(PAYMENT_META) as [PaymentMethod, typeof PAYMENT_META[PaymentMethod]][]).map(([method, meta]) => {
                  const Icon = meta.icon
                  const isSelected = paymentMethod === method
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        padding: '0.65rem 0.5rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        border: isSelected ? `2px solid ${meta.color}` : '2px solid rgba(255,255,255,0.08)',
                        background: isSelected ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                        color: isSelected ? meta.color : 'rgba(255,255,255,0.4)',
                        fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      <Icon size={16} />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Order summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>ملخص الفاتورة</p>
              {cart.map(i => (
                <div key={i.product._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{i.product.name} {i.qty > 1 ? `×${i.qty}` : ''}</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700, direction: 'ltr' }}>{fmt(i.actualUnitPrice * i.qty)} ج.م</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0.65rem 0' }} />
              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#f59e0b', marginBottom: '0.35rem' }}>
                  <span>الخصم الكلي</span>
                  <span style={{ direction: 'ltr' }}>- {fmt(totalDiscount)} ج.م</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem', color: '#FFFFFF' }}>
                <span>الإجمالي</span>
                <span style={{ color: '#0ea5e9', direction: 'ltr' }}>{fmt(totalSale)} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: totalProfit >= 0 ? '#22c55e' : '#ef4444', marginTop: '0.35rem' }}>
                <span>الربح الصافي</span>
                <span style={{ direction: 'ltr' }}>{fmt(totalProfit)} ج.م</span>
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={handleCheckout}
              disabled={submitting || !customer.trim()}
              style={{ width: '100%', background: submitting || !customer.trim() ? 'rgba(14,165,233,0.3)' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 14, padding: '1rem', fontWeight: 900, fontSize: '1.05rem', cursor: submitting || !customer.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: '0 8px 28px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
            >
              {submitting
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التسجيل…</>
                : <><CheckCircle2 size={18} /> تأكيد البيع وتسجيل الإيراد</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Expense Modal ────────────────────────────────────── */}
      {expenseModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpenseModal(false) }}
        >
          <div style={{ background: '#0a0a0a', borderRadius: 20, width: '100%', maxWidth: 400, padding: '2rem', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>إضافة مصروف</h2>
              <button onClick={() => setExpenseModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 50, padding: '0.35rem', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>عنوان المصروف</label>
                <input required type="text" placeholder="فاتورة، شحن، تغليف…" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>قيمة المصروف (ج.م)</label>
                <input required type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} style={{ ...inp, direction: 'ltr' }} />
              </div>
              <button type="submit" disabled={savingExpense} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 700, cursor: savingExpense ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {savingExpense ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                حفظ المصروف
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── IMEI Scanner Overlay ─────────────────────────────── */}
      {showScanner && (
        <ImeiScanner
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScan}
        />
      )}

      {/* ── Hidden Invoice Renderer (off-screen for PDF capture) ─── */}
      {completedSale && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1, pointerEvents: 'none' }}>
          <InvoiceTemplate data={completedSale} />
        </div>
      )}

      {/* ── Success Modal ────────────────────────────────── */}
      {successModal && completedSale && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(14px)' }}>
          <div style={{ background: '#0a0a0a', borderRadius: 24, width: '100%', maxWidth: 480, padding: '2.5rem', border: '1px solid rgba(14,165,233,0.3)', boxShadow: '0 40px 120px rgba(14,165,233,0.2)' }}>

            {/* Success badge */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e20, #0ea5e920)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={36} color="#22c55e" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.4rem' }}>تم البيع بنجاح! 🎉</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>الفاتورة #{completedSale.invoiceNumber} — {completedSale.date}</p>
            </div>

            {/* Sale summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>العميل</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{completedSale.customer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>المنتجات</span>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>{completedSale.items.map(i => i.productName).join(' + ')}</span>
              </div>
              {completedSale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>الخصم</span>
                  <span style={{ fontSize: '0.82rem', color: '#f59e0b', direction: 'ltr' }}>− {completedSale.discount.toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>الإجمالي</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0ea5e9', direction: 'ltr' }}>{completedSale.totalSalePrice.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* PDF Download */}
              <button
                onClick={async () => {
                  setGeneratingPDF(true)
                  try { await generateInvoicePDF(completedSale) }
                  finally { setGeneratingPDF(false) }
                }}
                disabled={generatingPDF}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: '0.95rem', cursor: generatingPDF ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
              >
                {generatingPDF ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                {generatingPDF ? 'جارٍ توليد الفاتورة…' : 'تحميل الفاتورة (PDF)'}
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  if (!completedSale.phone) { showToast('لا يوجد رقم هاتف للعميل', 'err'); return }
                  openWhatsApp(completedSale.phone, completedSale)
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '2px solid rgba(34,197,94,0.35)', borderRadius: 14, fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#22c55e'; b.style.color = '#fff' }}
                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(34,197,94,0.12)'; b.style.color = '#22c55e' }}
              >
                <MessageCircle size={18} /> إرسال عبر واتساب
              </button>

              {/* Dismiss */}
              <button
                onClick={() => { setSuccessModal(false); setCompletedSale(null) }}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
