'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, BarChart3, RefreshCw, Loader2, Calendar, MapPin, Printer, ArrowDownToLine, Package } from 'lucide-react'

type Product = {
  _id: string
  name: string
  price: number
  costPrice?: number
  stock: number
  branchId?: string
  location?: string
}

type SaleItem = {
  productId: string
  productName: string
  qty: number
  actualUnitPrice: number
  costAtSale: number
  fulfillmentLocation?: string
}

type Sale = {
  _id: string
  date: string
  items?: SaleItem[]
  totalSalePrice?: number
  totalCost?: number
  profit?: number
  total?: number 
  createdAt: string
}

type Expense = {
  _id: string
  title: string
  amount: number
  category?: string
  date: string
  createdAt: string
}

type Branch = {
  _id: string
  name: string
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedBranch, setSelectedBranch] = useState<string>('all')

  /* ── Fetch ────────────────────────────────────────────── */
  async function fetchAll() {
    setLoading(true)
    try {
      const [pRes, sRes, eRes, bRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/expenses'),
        fetch('/api/branches'),
      ])
      const [pData, sData, eData, bData] = await Promise.all([pRes.json(), sRes.json(), eRes.json(), bRes.json()])
      setProducts(pData.products ?? [])
      setSales(sData.sales ?? [])
      setExpenses(eData.expenses ?? [])
      setBranches(bData.branches ?? [])
    } catch (err) {
      console.error('[Reports] fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAll()
  }, [])

  /* ── Calculations & Filtering ─────────────────────────── */
  const { 
    grossRevenue, grossProfit, totalExpenses, netProfit, stockValuation,
    filteredSales, filteredExpenses
  } = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date('2000-01-01')
    start.setHours(0, 0, 0, 0)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)

    let gRev = 0, gCost = 0, tExp = 0, sVal = 0
    const matchedSales: Sale[] = []
    const matchedExpenses: Expense[] = []

    // Filter and calculate Sales
    sales.forEach(sale => {
      const saleDate = new Date(sale.date || sale.createdAt)
      if (saleDate >= start && saleDate <= end) {
        let saleMatches = false
        let saleGRev = 0
        let saleGCost = 0

        sale.items?.forEach(item => {
          const itemBranchId = item.fulfillmentLocation 
          let matchesBranch = true
          if (selectedBranch !== 'all') {
            const selectedBranchObj = branches.find(b => b._id === selectedBranch)
            if (selectedBranchObj) {
               matchesBranch = (itemBranchId === selectedBranchObj._id || itemBranchId === selectedBranchObj.name)
            } else {
               matchesBranch = false
            }
          }

          if (matchesBranch) {
            saleMatches = true
            saleGRev += (item.actualUnitPrice * item.qty) || 0
            saleGCost += (item.costAtSale * item.qty) || 0
          }
        })

        if (!sale.items || sale.items.length === 0) {
           if (selectedBranch === 'all') {
              saleMatches = true
              saleGRev += sale.totalSalePrice ?? sale.total ?? 0
              saleGCost += sale.totalCost ?? 0
           }
        }

        if (saleMatches) {
          gRev += saleGRev
          gCost += saleGCost
          // Create shallow copy with computed filtered totals for the ledger printout
          matchedSales.push({ ...sale, totalSalePrice: saleGRev, profit: saleGRev - saleGCost, totalCost: saleGCost })
        }
      }
    })

    // Filter and calculate Expenses
    expenses.forEach(exp => {
      const expDate = new Date(exp.date || exp.createdAt)
      if (expDate >= start && expDate <= end) {
        tExp += exp.amount || 0
        matchedExpenses.push(exp)
      }
    })

    // Filter and calculate Stock Valuation
    products.forEach(prod => {
       let matchesBranch = true
       if (selectedBranch !== 'all') {
          matchesBranch = (prod.branchId === selectedBranch)
       }
       if (matchesBranch) {
         sVal += (prod.stock * (prod.costPrice || 0))
       }
    })

    return { 
      grossRevenue: gRev, grossProfit: gRev - gCost, totalExpenses: tExp, 
      netProfit: (gRev - gCost) - tExp, stockValuation: sVal,
      filteredSales: matchedSales, filteredExpenses: matchedExpenses
    }
  }, [sales, expenses, products, branches, startDate, endDate, selectedBranch])


  /* ── Export PDF ───────────────────────────────────────── */
  const handlePrint = () => {
    // Inject the document title dynamically so "Save as PDF" reads cleanly
    let branchName = 'All_Branches'
    if (selectedBranch !== 'all') {
      const b = branches.find(x => x._id === selectedBranch)
      if (b) branchName = b.name.replace(/\s+/g, '_')
    }
    document.title = `Almaz_Report_${branchName}_${startDate}_to_${endDate}`
    window.print()
  }

  /* ── UI Constants ─────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: '#141414', borderRadius: 16, padding: '1.5rem',
    border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden'
  }
  const filterInput: React.CSSProperties = {
    padding: '0.65rem 0.9rem', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem', colorScheme: 'dark'
  }

  if (!mounted) return null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Header & Export (no-print) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
           <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>مركز التقارير المتقدم</p>
           <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>لوحة الأداء المالي</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchAll}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.7rem 1.2rem', fontWeight: 600, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            تحديث البيانات
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '0.7rem 1.4rem', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(14,165,233,0.35)' }}
          >
            <Printer size={16} />
            طباعة التقرير (PDF)
          </button>
        </div>
      </div>

      {/* Control Panel / Filters (no-print) */}
      <div className="no-print" style={{ background: '#080808', border: '1px solid rgba(14,165,233,0.2)', padding: '1.5rem', borderRadius: 16, marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={13} /> من تاريخ</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={filterInput} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={13} /> إلى تاريخ</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={filterInput} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 250px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={13} /> الفرع المستهدف</label>
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ ...filterInput, color: selectedBranch === 'all' ? '#0ea5e9' : '#fff' }}>
            <option value="all">تجميعي (Consolidated / All Branches)</option>
            {branches.map(b => (
              <option key={b._id} value={b._id} style={{color: '#fff', background: '#111'}}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── The Printable Area ── */}
      <div id="printable-report" style={{ background: 'transparent' }}>
         
         {/* Print Page Header */}
         <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
           <div>
             <h2 style={{ fontSize: '1.4rem', color: 'inherit', fontWeight: 800 }}>التقرير المالي العام</h2>
             <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 600 }}>
               الفترة من {startDate} إلى {endDate} • {selectedBranch === 'all' ? 'جميع الفروع' : branches.find(b => b._id === selectedBranch)?.name}
             </p>
           </div>
           <div style={{ margin: '0 auto 0 0', textAlign: 'left' }}>
              <div style={{ direction: 'ltr', fontSize: '1.4rem', fontWeight: 300, letterSpacing: '0.14em' }}>
                <span style={{ fontWeight: 600 }}>ألمظ</span>
                <span className="no-print" style={{ color: '#0ea5e9', margin: '0 0.3rem', fontWeight: 100 }}>|</span>
                <span className="print-only-inline" style={{ margin: '0 0.3rem', fontWeight: 100, display: 'none' }}>|</span>
                استور
              </div>
           </div>
         </div>

         {loading ? (
             <div className="no-print" style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem' }}>
               <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
               جارٍ معالجة البيانات…
             </div>
         ) : (
           <>
             {/* KPI Cards */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
               
               {/* إجمالي المبيعات */}
               <div className="kpi-card" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>إجمالي الإيرادات</p>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18} color="#0ea5e9" strokeWidth={2} />
                    </div>
                  </div>
                  <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0ea5e9', direction: 'ltr' }}>{grossRevenue.toLocaleString('ar-EG')}</p>
               </div>

               {/* مجمل الربح */}
               <div className="kpi-card" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>مجمل الربح (Gross)</p>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={18} color="#22c55e" strokeWidth={2} />
                    </div>
                  </div>
                  <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e', direction: 'ltr' }}>{grossProfit.toLocaleString('ar-EG')}</p>
               </div>

               {/* المصروفات */}
               <div className="kpi-card" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                     <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>إجمالي المصروفات</p>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <ArrowDownToLine size={18} color="#ef4444" strokeWidth={2} />
                     </div>
                  </div>
                  <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', direction: 'ltr' }}>{totalExpenses.toLocaleString('ar-EG')}</p>
               </div>

               {/* صافي الربح */}
               <div className="kpi-card" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>صافي الأرباح (Net)</p>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={18} color="#a855f7" strokeWidth={2} />
                    </div>
                  </div>
                  <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a855f7', direction: 'ltr' }}>{netProfit.toLocaleString('ar-EG')}</p>
               </div>

               {/* تقييم المخزون */}
               <div className="kpi-card" style={{ ...cardStyle, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                     <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Package size={22} color="#f59e0b" strokeWidth={2} />
                     </div>
                     <div>
                       <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>إجمالي تقييم المخزون المتبقي بالقيمة الشرائية</p>
                       <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b', direction: 'ltr' }}>{stockValuation.toLocaleString('ar-EG')} ج.م</p>
                     </div>
                  </div>
               </div>
             </div>

             {/* Detailed Drill-Down Tables */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
               
               {/* Sales Ledger */}
               <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'inherit', borderBottom: '2px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>سجل المبيعات التفصيلي</h3>
                  {filteredSales.length === 0 ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>لا توجد مبيعات في هذه الفترة.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', textAlign: 'right', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>التاريخ</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>رقم الفاتورة</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>الفرع</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>التفاصيل</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>الإيراد</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>مجمل الربح</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map(sale => {
                            const dateStr = sale.date || sale.createdAt.split('T')[0]
                            const itemsStr = sale.items?.map(i => `${i.productName} (x${i.qty})`).join('، ') || 'بيانات قديمة'
                            const branchStr = sale.items && sale.items[0] ? sale.items[0].fulfillmentLocation : 'غير محدد'
                            return (
                              <tr key={sale._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem' }}>{dateStr}</td>
                                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>#{sale._id.slice(-6).toUpperCase()}</td>
                                <td style={{ padding: '0.75rem' }}>{branchStr}</td>
                                <td style={{ padding: '0.75rem', maxWidth: 300 }}>{itemsStr}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0ea5e9' }}>{(sale.totalSalePrice ?? 0).toLocaleString('ar-EG')}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#22c55e' }}>{(sale.profit ?? 0).toLocaleString('ar-EG')}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>

               {/* Expenses Ledger */}
               <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'inherit', borderBottom: '2px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>سجل المصروفات التفصيلي</h3>
                  {filteredExpenses.length === 0 ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>لا توجد مصروفات في هذه الفترة.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', textAlign: 'right', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>التاريخ</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>البند</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>التصنيف</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' }}>المبلغ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.map(exp => {
                            const dateStr = exp.date ? exp.date.split('T')[0] : exp.createdAt.split('T')[0]
                            return (
                              <tr key={exp._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem' }}>{dateStr}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{exp.title}</td>
                                <td style={{ padding: '0.75rem' }}>{exp.category || 'عام'}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#ef4444' }}>{exp.amount.toLocaleString('ar-EG')}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>

             </div>
           </>
         )}
         
         <div className="print-only-block" style={{ marginTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem', textAlign: 'center', display: 'none' }}>
           <p style={{ fontSize: '0.65rem', color: '#666' }}>ألمظ استور للإلكترونيات والأجهزة الذكية — وثيقة مالية صالحة للفترة المحددة أعلاه.</p>
         </div>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media print {
          .print-only-inline { display: inline !important; color: #000 !important; }
          .print-only-block { display: block !important; }
          .kpi-card { border: 1px solid #ddd !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ccc !important; padding: 8px !important; color: #000 !important; }
          th { background: #f9f9f9 !important; font-weight: bold !important; }
          tr { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  )
}
