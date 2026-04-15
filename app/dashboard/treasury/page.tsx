'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, X, Loader2, ArrowDownCircle, ArrowUpCircle,
  Banknote, CreditCard, Smartphone, Zap, Building2, Wallet, RefreshCw
} from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────── */
type PaymentMethod = 'Cash' | 'Visa' | 'Valu' | 'InstaPay' | 'Vodafone Cash'
type TxType = 'IN' | 'OUT'

interface Channel {
  method: PaymentMethod
  totalIn: number
  totalOut: number
  balance: number
  txCount: number
}

interface TreasuryData {
  channels: Channel[]
  grandTotal: number
  grandIn: number
  grandOut: number
}

interface RecentTx {
  _id: string
  amount: number
  type: TxType
  paymentMethod: PaymentMethod
  description?: string
  date: string
}

const blankTx = {
  amount: '',
  type: 'IN' as TxType,
  paymentMethod: 'Cash' as PaymentMethod,
  description: '',
  referenceId: '',
}

/* ── Channel metadata ───────────────────────────────────────── */
const CHANNEL_META: Record<PaymentMethod, { icon: React.ElementType; color: string; labelAr: string }> = {
  'Cash':         { icon: Banknote,    color: '#22c55e', labelAr: 'كاش (نقدي)' },
  'Visa':         { icon: CreditCard,  color: '#0ea5e9', labelAr: 'فيزا' },
  'Valu':         { icon: Building2,   color: '#a855f7', labelAr: 'ValU' },
  'InstaPay':     { icon: Zap,         color: '#f59e0b', labelAr: 'إنستاباي' },
  'Vodafone Cash':{ icon: Smartphone,  color: '#ef4444', labelAr: 'فودافون كاش' },
}

/* ── Helpers ────────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── Page ───────────────────────────────────────────────────── */
export default function TreasuryPage() {
  const [data,      setData]      = useState<TreasuryData | null>(null)
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState({ ...blankTx })
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [deletingId,setDeletingId]= useState<string | null>(null)

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rT, rTx] = await Promise.all([
        fetch('/api/treasury'),
        fetch('/api/transactions?limit=20'),
      ])
      const dT  = await rT.json()
      const dTx = await rTx.json()
      if (dT.success)  setData(dT)
      if (dTx.success) setRecentTxs(dTx.transactions ?? [])
    } catch {
      showToast('فشل تحميل بيانات الخزنة', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Toast ──────────────────────────────────────────────── */
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── Save transaction ───────────────────────────────────── */
  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'err')
      return
    }
    setSaving(true)
    try {
      const res  = await fetch('/api/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:        Number(form.amount),
          type:          form.type,
          paymentMethod: form.paymentMethod,
          description:   form.description.trim() || undefined,
          referenceId:   form.referenceId.trim()  || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'فشل الحفظ')

      showToast('تمت إضافة الحركة المالية ✓', 'ok')
      setModal(false)
      setForm({ ...blankTx })
      await fetchData() // re-aggregate
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete transaction ─────────────────────────────────── */
  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      setRecentTxs(prev => prev.filter(t => t._id !== id))
      await fetchData()
      showToast('تم حذف الحركة', 'ok')
    } catch {
      showToast('فشل الحذف', 'err')
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Shared styles ──────────────────────────────────────── */
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.68rem 0.9rem',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    fontSize: '0.92rem', fontFamily: 'inherit', color: '#FFFFFF',
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

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>إدارة السيولة</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF' }}>الخزنة المركزية</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', marginTop: '0.2rem' }}>تتبع السيولة المالية عبر جميع القنوات</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.72rem 1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <RefreshCw size={16} /> تحديث
          </button>
          <button
            onClick={() => { setForm({ ...blankTx }); setModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.72rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(14,165,233,0.35)' }}
          >
            <Plus size={18} strokeWidth={2.5} /> إضافة حركة مالية
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ تحميل الخزنة…
        </div>
      ) : (
        <>
          {/* ── Grand Total Card ─────────────────────────────── */}
          <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0.06) 100%)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 20, padding: '2rem 2.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={28} color="#0ea5e9" strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.2rem' }}>إجمالي السيولة الكلية</p>
                <p style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, color: '#FFFFFF', direction: 'ltr', lineHeight: 1 }}>
                  {fmt(data?.grandTotal ?? 0)} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>ج.م</span>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '0.25rem' }}>إجمالي الوارد (IN)</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e', direction: 'ltr' }}>+ {fmt(data?.grandIn ?? 0)} ج.م</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '0.25rem' }}>إجمالي الصادر (OUT)</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', direction: 'ltr' }}>- {fmt(data?.grandOut ?? 0)} ج.م</p>
              </div>
            </div>
          </div>

          {/* ── Channel Cards Grid ───────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {(data?.channels ?? []).map((ch) => {
              const meta    = CHANNEL_META[ch.method]
              const Icon    = meta.icon
              const color   = meta.color
              const isPos   = ch.balance >= 0

              return (
                <div
                  key={ch.method}
                  style={{ background: '#111111', border: `1px solid ${color}22`, borderRadius: 18, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  {/* Icon + Method */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color={color} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{meta.labelAr}</p>
                      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{ch.txCount} حركة</p>
                    </div>
                  </div>

                  {/* Balance */}
                  <p style={{ fontSize: '1.45rem', fontWeight: 900, color: isPos ? color : '#ef4444', direction: 'ltr', lineHeight: 1 }}>
                    {isPos ? '' : '−'}{fmt(Math.abs(ch.balance))}
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginRight: '0.3rem' }}>ج.م</span>
                  </p>

                  {/* IN / OUT */}
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>
                    <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ArrowDownCircle size={12} /> {fmt(ch.totalIn)}
                    </span>
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ArrowUpCircle size={12} /> {fmt(ch.totalOut)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Recent Transactions Feed ─────────────────────── */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>آخر الحركات المالية</h2>
            <div style={{ background: '#111111', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {recentTxs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)' }}>لا توجد حركات مسجلة بعد</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(14,165,233,0.1)' }}>
                      {['التاريخ', 'النوع', 'القناة', 'المبلغ', 'البيان', ''].map((h) => (
                        <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs.map((tx) => {
                      const meta  = CHANNEL_META[tx.paymentMethod] ?? { color: '#fff', labelAr: tx.paymentMethod, icon: Wallet }
                      const isIN  = tx.type === 'IN'
                      const date  = new Date(tx.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
                      return (
                        <tr
                          key={tx._id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.025)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                        >
                          <td style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{date}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.22rem 0.65rem', borderRadius: 50, background: isIN ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isIN ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              {isIN ? <ArrowDownCircle size={11} /> : <ArrowUpCircle size={11} />}
                              {isIN ? 'وارد' : 'صادر'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ color: meta.color, fontWeight: 700, fontSize: '0.8rem' }}>{meta.labelAr}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: isIN ? '#22c55e' : '#ef4444', direction: 'ltr', whiteSpace: 'nowrap' }}>
                            {isIN ? '+' : '−'} {fmt(tx.amount)} ج.م
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.45)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <button
                              onClick={() => handleDelete(tx._id)}
                              disabled={deletingId === tx._id}
                              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '0.35rem 0.55rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', opacity: deletingId === tx._id ? 0.5 : 1 }}
                            >
                              {deletingId === tx._id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={13} />}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Record Transaction Modal ─────────────────────────── */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div style={{ background: '#0a0a0a', borderRadius: 20, width: '100%', maxWidth: 480, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(14,165,233,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>إضافة حركة مالية</h2>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 50, padding: '0.35rem', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Type Toggle */}
              {field(<>
                <label style={lbl}>نوع الحركة *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {(['IN', 'OUT'] as TxType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      style={{
                        padding: '0.8rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem',
                        border: form.type === t
                          ? `2px solid ${t === 'IN' ? '#22c55e' : '#ef4444'}`
                          : '2px solid rgba(255,255,255,0.08)',
                        background: form.type === t
                          ? (t === 'IN' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)')
                          : 'rgba(255,255,255,0.03)',
                        color: form.type === t
                          ? (t === 'IN' ? '#22c55e' : '#ef4444')
                          : 'rgba(255,255,255,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {t === 'IN' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                      {t === 'IN' ? 'وارد (IN)' : 'صادر (OUT)'}
                    </button>
                  ))}
                </div>
              </>)}

              {/* Amount */}
              {field(<>
                <label style={lbl}>المبلغ (ج.م) *</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inp, direction: 'ltr', fontSize: '1.1rem', fontWeight: 700 }}
                />
              </>)}

              {/* Payment Method */}
              {field(<>
                <label style={lbl}>القناة المالية *</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })} style={inp}>
                  {(['Cash', 'Visa', 'Valu', 'InstaPay', 'Vodafone Cash'] as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>{CHANNEL_META[m].labelAr}</option>
                  ))}
                </select>
              </>)}

              {/* Description */}
              {field(<>
                <label style={lbl}>البيان / الوصف</label>
                <input
                  type="text" placeholder="مثال: مبيعات يومية، دفعة مورد…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={inp}
                />
              </>)}

              {/* Reference */}
              {field(<>
                <label style={lbl}>المرجع (اختياري)</label>
                <input
                  type="text" placeholder="معرف الطلب أو السند"
                  value={form.referenceId}
                  onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                  style={{ ...inp, direction: 'ltr' }}
                />
              </>)}
            </div>

            {/* Summary preview */}
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>المعاينة:</span>
              <span style={{ fontWeight: 900, color: form.type === 'IN' ? '#22c55e' : '#ef4444', direction: 'ltr' }}>
                {form.type === 'IN' ? '+' : '−'} {form.amount ? fmt(Number(form.amount)) : '0.00'} ج.م
                &nbsp;—&nbsp;{CHANNEL_META[form.paymentMethod].labelAr}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.75 : 1 }}
              >
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التسجيل…</> : 'تسجيل الحركة'}
              </button>
              <button onClick={() => setModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
