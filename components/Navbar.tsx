'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Menu, X, Smartphone } from 'lucide-react'

const navLinks = [
  { label: 'اتصل بنا', href: '#contact' },
  { label: 'المتجر',   href: '#products' },
  { label: 'الرئيسية', href: '/' },
]

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled]     = useState(false)
  const [open, setOpen]             = useState(false)

  // ── Secret Knock: 5 clicks on logo within 2 s → /dashboard ──
  const clickCount = useRef(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleLogoClick() {
    clickCount.current += 1

    // Reset the 2-second window on every click
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => { clickCount.current = 0 }, 2000)

    if (clickCount.current >= 5) {
      clickCount.current = 0
      if (resetTimer.current) clearTimeout(resetTimer.current)
      router.push('/dashboard')
    }
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => {
      window.removeEventListener('scroll', handler)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.93)' : '#FFFFFF',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(212,175,55,0.15)'
          : '1px solid transparent',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/*
        3-column grid (page is dir="rtl"):
          col-1  right/start  → Arabic nav links
          col-2  center       → Typographic logo (forced LTR)
          col-3  left/end     → WhatsApp CTA
      */}
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 2rem',
          height: 72,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}
      >
        {/* ── COL-1: Arabic nav links (visual RIGHT in RTL) ──── */}
        <ul
          className="hidden-mobile"
          style={{
            listStyle: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            justifyContent: 'flex-start',
          }}
        >
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                style={{
                  fontSize: '0.97rem',
                  fontWeight: 600,
                  color: '#1D1D1F',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#D4AF37'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#1D1D1F'
                }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── COL-2: Secret-knock typographic logo — CENTER ─────
              direction:ltr prevents RTL from reversing the letters.
              5 rapid clicks → router.push('/dashboard')
        ────────────────────────────────────────────────────── */}
        <div
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          title="almaz store"
          aria-label="الرئيسية"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogoClick() }}
        >
          <div
            style={{
              /* Force LTR: prevents RTL from reversing almaz | st[icon]re */
              direction: 'ltr',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.5rem',
              fontWeight: 300,
              letterSpacing: '0.16em',
              color: '#1D1D1F',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            <span style={{ fontWeight: 500 }}>almaz</span>

            <span
              style={{
                color: '#D4AF37',
                margin: '0 0.45rem',
                fontSize: '1.8rem',
                fontWeight: 100,
                lineHeight: 1,
                opacity: 0.9,
              }}
            >
              |
            </span>

            <span style={{ display: 'flex', alignItems: 'center' }}>
              st
              <Smartphone
                style={{
                  width: 22,
                  height: 22,
                  margin: '0 2px',
                  strokeWidth: 1.5,
                  color: '#1D1D1F',
                  flexShrink: 0,
                  position: 'relative',
                  top: 1,
                }}
              />
              re
            </span>
          </div>
        </div>

        {/* ── COL-3: WhatsApp CTA + mobile toggle (visual LEFT) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            justifyContent: 'flex-end',
          }}
        >
          <a
            id="whatsapp-cta"
            href="https://wa.me/201551190990"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#D4AF37',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.48rem 1.15rem',
              borderRadius: 50,
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(212,175,55,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
              direction: 'ltr',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 8px 26px rgba(212,175,55,0.52)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 4px 18px rgba(212,175,55,0.35)'
            }}
          >
            <MessageCircle size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} />
            <span className="hidden-mobile" style={{ direction: 'rtl' }}>تواصل معنا</span>
          </a>

          <button
            id="mobile-menu-toggle"
            aria-label="القائمة"
            className="show-mobile"
            onClick={() => setOpen(!open)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#1D1D1F',
              display: 'none',
              padding: 4,
            }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      {open && (
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid rgba(212,175,55,0.14)',
            padding: '1.25rem 2rem 1.5rem',
          }}
        >
          {[...navLinks].reverse().map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '0.7rem 0',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#1D1D1F',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {l.label}
            </Link>
          ))}

          <a
            href="https://wa.me/201551190990"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#D4AF37',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.92rem',
              padding: '0.5rem 1.2rem',
              borderRadius: 50,
              textDecoration: 'none',
              direction: 'ltr',
            }}
          >
            <MessageCircle size={16} strokeWidth={2.2} />
            <span style={{ direction: 'rtl' }}>تواصل معنا</span>
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
