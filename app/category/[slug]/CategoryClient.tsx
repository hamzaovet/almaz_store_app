'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Product = {
  _id: string
  name: string
  price: number
  stock: number
  specs?: string
  imageUrl?: string
  badge?: string
  condition?: string
}

type Category = {
  name: string
  description?: string
  icon: string
}

function getIcon(iconName: string) {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Package
  return Icon
}

export function CategoryClient({ category, products }: { category: Category, products: Product[] }) {
  const [filter, setFilter] = useState<'All' | 'New' | 'Used'>('All')

  const filteredProducts = products.filter(p => {
    if (filter === 'All') return true
    // default condition is 'New' if completely undefined
    const cond = p.condition || 'New'
    return cond === filter
  })

  const Icon = getIcon(category.icon)

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', paddingBottom: '4rem' }}>
      {/* ── Header ── */}
      <header style={{ padding: '3rem 2rem 2rem', background: '#111111', borderBottom: '1px solid rgba(29,29,31,0.07)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(14,165,233,0.1)', padding: '0.4rem 0.8rem', borderRadius: 50 }}>
            <ChevronRight size={16} /> العودة للرئيسية
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={32} color="#0ea5e9" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.2rem' }}>{category.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>{category.description || `تصفح جميع الهواتف والمعدات المرتبطة بقسم ${category.name}`}</p>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        {/* ── Filter Tabs ── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          {(['All', 'New', 'Used'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                background: filter === tab ? 'rgba(14,165,233,0.15)' : 'transparent',
                border: filter === tab ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                color: filter === tab ? '#0ea5e9' : 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                padding: '0.6rem 1.4rem',
                borderRadius: 50,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                fontSize: '0.95rem'
              }}
            >
              {tab === 'All' ? 'الكل' : tab === 'New' ? 'جديد (New)' : 'مستعمل (Used)'}
            </button>
          ))}
        </div>

        {/* ── Product Grid ── */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>لا توجد منتجات في هذه الفئة حالياً</p>
          </div>
        ) : (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <AnimatePresence>
              {filteredProducts.map((p, i) => (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  style={{ background: '#111111', border: '1px solid rgba(29,29,31,0.07)', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <div style={{ background: 'linear-gradient(135deg, #082f49 0%, #0c4a6e 100%)', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(14,165,233,0.12)', border: '1.5px solid rgba(14,165,233,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={30} color="#0ea5e9" strokeWidth={1.6} />
                      </div>
                    )}
                    {/* Badge / Condition overlay */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ background: (p.condition || 'New') === 'New' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: (p.condition || 'New') === 'New' ? '#4ade80' : '#fbbf24', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 50, border: `1px solid ${(p.condition || 'New') === 'New' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
                        {(p.condition || 'New') === 'New' ? 'جديد' : 'مستعمل'}
                      </span>
                      {p.badge && (
                        <span style={{ background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 50, border: '1px solid rgba(56,189,248,0.2)' }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3 }}>{p.name}</h3>
                    {p.specs && (
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{p.specs}</p>
                    )}
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0ea5e9', direction: 'ltr' }}>{p.price.toLocaleString('ar-EG')} ج.م</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: p.stock > 10 ? '#22c55e' : p.stock > 0 ? '#f59e0b' : '#ef4444', background: p.stock > 10 ? 'rgba(34,197,94,0.08)' : p.stock > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', padding: '0.25rem 0.65rem', borderRadius: 50 }}>
                        {p.stock > 0 ? 'متوفر' : 'نفد'}
                      </span>
                    </div>
                    {/* WhatsApp */}
                    <a href={`https://wa.me/201129592916?text=${encodeURIComponent(`أريد الاستفسار عن: ${p.name}`)}`} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem', background: '#0ea5e9', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', transition: 'box-shadow 0.2s', fontFamily: 'inherit' }} onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px rgba(14,165,233,0.3)')} onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none')}>
                      طلب واستفسار
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  )
}
