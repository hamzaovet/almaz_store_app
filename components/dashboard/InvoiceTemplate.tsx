import React from 'react'

export interface InvoiceItem {
  productName: string
  serialNumber?: string
  storage?: string
  color?: string
  condition?: string
  qty: number
  unitPrice: number
  actualUnitPrice: number
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  time: string
  customer: string
  phone?: string
  paymentMethod: string
  items: InvoiceItem[]
  totalListPrice: number
  totalSalePrice: number
  discount: number
  profit: number
}

const PAYMENT_LABELS: Record<string, string> = {
  Cash:           'كاش (نقدي)',
  Visa:           'فيزا',
  Valu:           'ValU تقسيط',
  InstaPay:       'إنستاباي',
  'Vodafone Cash':'فودافون كاش',
}

function fmt(n: number) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function InvoiceTemplate({ data }: { data: InvoiceData }) {
  return (
    <div
      id="almaz-invoice"
      dir="rtl"
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: '#ffffff',
        fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
        color: '#0a0a0a',
        padding: '0',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* ── TOP ACCENT BAR ─────────────────────────────────────── */}
      <div style={{ height: 6, background: 'linear-gradient(90deg, #0ea5e9 0%, #22c55e 100%)' }} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        padding: '28px 36px 22px',
        background: '#0a0a0a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo_1.png"
            alt="ألمظ استور"
            style={{ width: 54, height: 54, objectFit: 'contain', borderRadius: 12 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              ألمظ استور
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#0ea5e9', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>
              Apple Premium Reseller — Egypt
            </div>
          </div>
        </div>

        {/* Invoice meta */}
        <div style={{ textAlign: 'left', direction: 'ltr' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            INVOICE
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>
            #{data.invoiceNumber}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
            {data.date}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            {data.time}
          </div>
        </div>
      </div>

      {/* ── CYAN DIVIDER ────────────────────────────────────────── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #0ea5e9, transparent)' }} />

      {/* ── CUSTOMER + PAYMENT STRIP ────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        padding: '18px 36px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        gap: 24,
      }}>
        {/* Customer */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            العميل
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>{data.customer}</div>
          {data.phone && (
            <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', marginTop: 3 }}>{data.phone}</div>
          )}
        </div>

        {/* Payment method */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            طريقة الدفع
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: '#0ea5e9', color: '#fff',
            padding: '5px 14px', borderRadius: 50,
            fontSize: 12, fontWeight: 700,
          }}>
            {PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}
          </div>
        </div>
      </div>

      {/* ── ITEMS TABLE ──────────────────────────────────────────── */}
      <div style={{ padding: '24px 36px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0a0a0a' }}>
              {['المنتج / التفاصيل', 'IMEI / السيريال', 'الحالة', 'الكمية', 'سعر الوحدة', 'الإجمالي'].map((h, i) => (
                <th key={h} style={{
                  padding: '10px 12px',
                  textAlign: i === 0 ? 'right' : i >= 3 ? 'center' : 'right',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => {
              const rowTotal = item.actualUnitPrice * item.qty
              const hasDiscount = item.actualUnitPrice < item.unitPrice
              const isOdd = idx % 2 === 0

              return (
                <tr key={idx} style={{ background: isOdd ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  {/* Product name + specs */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#0a0a0a', fontSize: 13 }}>{item.productName}</div>
                    {(item.storage || item.color) && (
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                        {[item.storage, item.color].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </td>

                  {/* Serial */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'top', direction: 'ltr', fontFamily: 'monospace', fontSize: 11, color: item.serialNumber ? '#0ea5e9' : '#94a3b8', fontWeight: item.serialNumber ? 700 : 400 }}>
                    {item.serialNumber ?? '—'}
                  </td>

                  {/* Condition */}
                  <td style={{ padding: '12px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: 50, fontSize: 10, fontWeight: 700,
                      background: item.condition === 'Used' ? '#fef3c7' : '#dcfce7',
                      color: item.condition === 'Used' ? '#92400e' : '#166534',
                    }}>
                      {item.condition === 'Used' ? 'مستعمل' : 'جديد'}
                    </span>
                  </td>

                  {/* Qty */}
                  <td style={{ padding: '12px 12px', textAlign: 'center', verticalAlign: 'top', fontWeight: 700, color: '#0a0a0a' }}>
                    {item.qty}
                  </td>

                  {/* Unit price */}
                  <td style={{ padding: '12px 12px', textAlign: 'center', verticalAlign: 'top', direction: 'ltr' }}>
                    {hasDiscount && (
                      <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through', marginBottom: 2 }}>
                        {fmt(item.unitPrice)}
                      </div>
                    )}
                    <div style={{ fontWeight: 800, color: hasDiscount ? '#0ea5e9' : '#0a0a0a', fontSize: 12 }}>
                      {fmt(item.actualUnitPrice)} ج.م
                    </div>
                  </td>

                  {/* Row total */}
                  <td style={{ padding: '12px 12px', textAlign: 'center', verticalAlign: 'top', fontWeight: 900, color: '#0a0a0a', direction: 'ltr', fontSize: 13 }}>
                    {fmt(rowTotal)} ج.م
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── TOTALS BLOCK ─────────────────────────────────────────── */}
      <div style={{ padding: '0 36px 28px', display: 'flex', justifyContent: 'flex-left' }}>
        <div style={{ marginRight: 'auto', minWidth: 280 }}>
          {/* Subtotal */}
          {data.discount > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
                <span>المجموع قبل الخصم</span>
                <span style={{ direction: 'ltr', fontWeight: 600 }}>{fmt(data.totalListPrice)} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: 12 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>الخصم الممنوح</span>
                <span style={{ direction: 'ltr', color: '#f59e0b', fontWeight: 700 }}>− {fmt(data.discount)} ج.م</span>
              </div>
            </>
          )}

          {/* Grand Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', marginTop: 8,
            background: 'linear-gradient(135deg, #0a0a0a 0%, #0f172a 100%)',
            borderRadius: 12, border: '2px solid #0ea5e9',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>الإجمالي النهائي</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#0ea5e9', direction: 'ltr' }}>{fmt(data.totalSalePrice)} ج.م</span>
          </div>
        </div>
      </div>

      {/* ── WARRANTY NOTE ──────────────────────────────────────────── */}
      {data.items.some(i => i.serialNumber) && (
        <div style={{ margin: '0 36px 24px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 4 }}>
            📋 ضمان الجهاز — أرقام السيريال المسجلة
          </div>
          {data.items.filter(i => i.serialNumber).map((i, idx) => (
            <div key={idx} style={{ fontSize: 10, color: '#166534', direction: 'ltr', fontFamily: 'monospace' }}>
              {i.productName}: <strong>{i.serialNumber}</strong>
            </div>
          ))}
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #0ea5e9, #22c55e, transparent)' }} />
        <div style={{ background: '#0a0a0a', padding: '14px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
            شكراً لثقتكم — ألمظ استور | Apple Premium Reseller
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', direction: 'ltr' }}>
            almaz-store.com
          </div>
        </div>
      </div>
    </div>
  )
}
