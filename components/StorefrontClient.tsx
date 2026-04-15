'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'

type Product = {
  _id: string
  name: string
  categoryId?: string | { _id: string, name: string }
  price: number
  stock: number
  specs?: string
  imageUrl?: string
  badge?: string
}

type Category = {
  _id: string
  name: string
  slug: string
  icon: string
  description: string
}

function getIcon(iconName: string) {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Package
  return Icon
}

export function StorefrontClient({ products, categories }: { products: Product[], categories: Category[] }) {
  return (
    <>
      {/* ── Hero Section ── */}
      <section style={{ padding: '3rem 1.5rem', background: '#0a0a0a', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 1100, height: 'clamp(420px, 60vw, 680px)', borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.18)' }}>
          <video autoPlay loop muted playsInline preload="auto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src="/assets/trailer.mp4" type="video/mp4" />
          </video>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', gap: '1.75rem' }}>
            <motion.p initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }} style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.2em', color: '#0ea5e9', textTransform: 'uppercase' }}>
              Apple Premium Reseller — Egypt
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }} style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.3, maxWidth: 740, textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
              ارتقِ بتجربتك المحمولة مع أكثر الأجهزة حصرية في العالم.{' '}
              <span style={{ color: '#0ea5e9' }}>ألمظ استور</span>
            </motion.h1>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, duration: 0.45, type: 'spring', stiffness: 180 }}>
              <a
                href="#categories"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2.25rem', border: '2px solid #0ea5e9', borderRadius: 50, color: '#0ea5e9', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', backdropFilter: 'blur(8px)', background: 'rgba(14,165,233,0.1)', letterSpacing: '0.02em', transition: 'all 0.25s' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#0ea5e9'; el.style.color = '#fff'; el.style.boxShadow = '0 0 32px rgba(14,165,233,0.5)' }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(14,165,233,0.1)'; el.style.color = '#0ea5e9'; el.style.boxShadow = 'none' }}
              >
                اكتشف المجموعة
                <ChevronLeft size={18} strokeWidth={2.5} />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Categories Grid ── */}
      <section id="categories" style={{ padding: '5rem 2rem', background: '#0a0a0a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.22em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              تسوق حسب الفئة
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#FFFFFF' }}>
              استكشف عالم ألمظ
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {categories.map((cat, i) => {
              const Icon = getIcon(cat.icon)
              return (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, type: 'spring', stiffness: 140 }}
                >
                  <Link href={`/category/${cat.slug}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        position: 'relative', background: '#111111', border: '1px solid rgba(29,29,31,0.07)',
                        borderRadius: '1.5rem', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column',
                        gap: '1rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.transform = 'translateY(-6px)'
                        el.style.boxShadow = '0 24px 50px rgba(14,165,233,0.18)'
                        el.style.borderColor = 'rgba(14,165,233,0.35)'
                        el.style.background = '#042f4b'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.transform = 'translateY(0)'
                        el.style.boxShadow = 'none'
                        el.style.borderColor = 'rgba(29,29,31,0.07)'
                        el.style.background = '#111111'
                      }}
                    >
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(14,165,233,0.2)', transition: 'all 0.3s' }}>
                        <Icon size={26} color="#0ea5e9" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                          {cat.name}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(29,29,31,0.55)', lineHeight: 1.65 }}>
                          {cat.description}
                        </p>
                      </div>
                      <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', color: '#0ea5e9', opacity: 0.7, transition: 'all 0.3s' }}>
                        <ChevronLeft size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Sonar Scanner (receives all products) ── */}
      <SonarScanner products={products} />
    </>
  )
}

function SonarScanner({ products }: { products: Product[] }) {
  const [visibleCards, setVisibleCards] = useState<Product[]>([])
  const lastTriggerRef = useRef<string[]>([])
  const rafRef = useRef<number>(0)
  const RADAR_SIZE = 280

  useEffect(() => {
    if (products.length === 0) return
    let frame = 0

    function tick() {
      frame++
      if (frame % 68 === 0) {
        const remaining = products.filter((p) => !lastTriggerRef.current.includes(p._id))
        const pool = remaining.length > 0 ? remaining : products
        const pick = pool[Math.floor(Math.random() * pool.length)]

        lastTriggerRef.current = [...lastTriggerRef.current, pick._id].slice(-3)
        setVisibleCards((prev) => [...prev, pick].slice(-3))

        setTimeout(() => {
          setVisibleCards((prev) => {
            const idx = prev.findIndex((p) => p._id === pick._id)
            return idx !== -1 ? prev.filter((_, i) => i !== idx) : prev
          })
        }, 3200)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [products])

  return (
    <section style={{ padding: '6rem 2rem', background: '#0a0a0c', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.22em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.6rem' }}>ماسح المنتجات</p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.25 }}>اكتشف مجموعتنا الحصرية</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          الرادار يكشف عن {products.length} منتج متاح في ألمظ استور
        </p>
      </div>

      <div style={{ position: 'relative', width: RADAR_SIZE, height: RADAR_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sweepGrad" cx="50%" cy="40%" r="60%" fx="50%" fy="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={140} cy={140} r={138} fill="url(#radarGrad)" />
          {[35, 70, 105, 138].map((r) => <circle key={r} cx={140} cy={140} r={r} fill="none" stroke="#0ea5e9" strokeOpacity={0.12} strokeWidth={1} />)}
          <line x1={140} y1={2} x2={140} y2={278} stroke="#0ea5e9" strokeOpacity={0.1} strokeWidth={1} />
          <line x1={2} y1={140} x2={278} y2={140} stroke="#0ea5e9" strokeOpacity={0.1} strokeWidth={1} />
          <motion.g style={{ originX: '50%', originY: '50%', transformOrigin: '140px 140px' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}>
            <path d={`M140,140 L140,2 A138,138,0,0,1,${140 + 138 * Math.sin((72 * Math.PI) / 180)},${140 - 138 * Math.cos((72 * Math.PI) / 180)} Z`} fill="url(#sweepGrad)" />
          </motion.g>
          <circle cx={140} cy={140} r={5} fill="#0ea5e9" />
        </svg>

        {[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(14,165,233,0.25)', animation: `sonar-ring 3s ${i}s ease-out infinite` }} />)}

        <AnimatePresence>
          {visibleCards.map((product, i) => {
            const angle = (-45 + i * 70) * (Math.PI / 180)
            const dist = 180 + i * 20
            const x = Math.cos(angle) * dist
            const y = Math.sin(angle) * dist
            return (
              <motion.div key={`${product._id}-${i}`} initial={{ opacity: 0, scale: 0.7, x, y }} animate={{ opacity: 1, scale: 1, x, y }} exit={{ opacity: 0, scale: 0.7 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} style={{ position: 'absolute', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(14,165,233,0.28)', backdropFilter: 'blur(14px)', borderRadius: 14, padding: '0.75rem 1rem', minWidth: 160, zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{product.name}</div>
                <div style={{ color: '#0ea5e9', fontWeight: 800, fontSize: '0.92rem', direction: 'ltr', textAlign: 'right' }}>{product.price.toLocaleString('ar-EG')} ج.م</div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <style>{`
        @keyframes sonar-ring {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </section>
  )
}
