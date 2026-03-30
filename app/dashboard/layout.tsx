'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  User,
} from 'lucide-react'

const navItems = [
  { label: 'نظرة عامة',  href: '/dashboard',          icon: LayoutDashboard },
  { label: 'المنتجات',   href: '/dashboard/products',  icon: Package },
  { label: 'المبيعات',   href: '/dashboard/sales',     icon: TrendingUp },
  { label: 'التقارير',   href: '/dashboard/reports',   icon: BarChart3 },
  { label: 'الإعدادات', href: '/dashboard/settings',  icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{name: string, role: string} | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(console.error)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: '#f4f4f6',
        direction: 'rtl',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        style={{
          width: 256,
          background: '#0a0a0c',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1rem',
          gap: '0.35rem',
          borderLeft: '1px solid rgba(212,175,55,0.12)',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
      >
        {/* Sidebar header */}
        <div style={{ marginBottom: '1.75rem', padding: '0 0.5rem' }}>
          {/* Typographic logo */}
          <div
            style={{
              direction: 'ltr',
              fontSize: '1.1rem',
              fontWeight: 300,
              letterSpacing: '0.14em',
              color: '#FFFFFF',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>ألمظ</span>
            <span style={{ color: '#D4AF37', margin: '0 0.3rem', fontWeight: 100 }}>|</span>
            استور
          </div>
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#D4AF37',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            لوحة التحكم
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.76rem' }}>
            إدارة ألمظ استور
          </p>

          {/* User Profile Info */}
          {user && (
            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#D4AF37" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                <p style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 600 }}>{user.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        {navItems.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.72rem 0.9rem',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.92rem',
                color: active ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                border: active
                  ? '1px solid rgba(212,175,55,0.22)'
                  : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'rgba(255,255,255,0.9)'
                  el.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'rgba(255,255,255,0.6)'
                  el.style.background = 'transparent'
                }
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
              {item.label}
            </Link>
          )
        })}

        {/* Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#ef4444',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.5rem 0.85rem',
              transition: 'color 0.2s',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              width: '100%'
            }}
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
