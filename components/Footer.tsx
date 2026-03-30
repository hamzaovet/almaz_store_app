'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { MapPin, Phone, MessageCircle } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  const [whatsappNum, setWhatsappNum] = useState('201129592916')

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setWhatsappNum(data.whatsappNumber))
      .catch(console.error)
  }, [])

  return (
    <footer
      style={{
        background: '#0a0a0c',
        color: '#FFFFFF',
        padding: '5rem 2rem 2.5rem',
        direction: 'rtl',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Top Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            marginBottom: '4rem',
          }}
        >
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Image
                src="/assets/logo.png"
                alt="ألمظ استور"
                width={48}
                height={48}
                style={{ objectFit: 'contain', borderRadius: 10, filter: 'brightness(1.1)' }}
              />
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#D4AF37',
                  letterSpacing: '-0.01em',
                }}
              >
                ألمظ استور
              </span>
            </div>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.8,
                maxWidth: 300,
              }}
            >
              ألمظ استور هو وكيلك المعتمد لأبل في مصر. نقدم أحدث الأجهزة الذكية الحصرية بضمان رسمي وخدمة عملاء على مدار الساعة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                borderBottom: '2px solid #D4AF37',
                paddingBottom: '0.5rem',
                display: 'inline-block',
              }}
            >
              روابط سريعة
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'الرئيسية', href: '/' },
                { label: 'المتجر', href: '#categories' },
                { label: 'اتصل بنا', href: '#contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = '#D4AF37')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')
                    }
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Block */}
          <div id="contact">
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                borderBottom: '2px solid #D4AF37',
                paddingBottom: '0.5rem',
                display: 'inline-block',
              }}
            >
              تواصل معنا
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <MapPin size={18} color="#D4AF37" strokeWidth={1.8} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: 600 }}>
                  السراج مول، مكرم عبيد، مدينة نصر
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Phone size={18} color="#D4AF37" strokeWidth={1.8} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: 600, direction: 'ltr' }}>
                  هاتف: 01129592916
                </span>
              </div>
              <a
                href="https://wa.me/201129592916"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  color: '#D4AF37',
                  padding: '0.5rem 1.1rem',
                  borderRadius: 50,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                  marginTop: '0.25rem',
                  width: 'fit-content',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(212,175,55,0.28)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(212,175,55,0.15)')
                }
              >
                <MessageCircle size={16} strokeWidth={2} />
                واتساب
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
            marginBottom: '2rem',
          }}
        />

        {/* Bottom Signatures */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            textAlign: 'center',
          }}
        >
          {/* NEXARA Signature */}
          <a
            href="https://nexara-platform.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#D4AF37',
              fontWeight: 800,
              fontSize: '0.88rem',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              textShadow: '0 0 18px rgba(212,175,55,0.55), 0 0 40px rgba(212,175,55,0.25)',
              transition: 'text-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.textShadow =
                '0 0 28px rgba(212,175,55,0.9), 0 0 60px rgba(212,175,55,0.5)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.textShadow =
                '0 0 18px rgba(212,175,55,0.55), 0 0 40px rgba(212,175,55,0.25)'
            }}
          >
            ✦ Infrastructure by NEXARA FMW ✦
          </a>

          {/* Dr. Hamza Signature */}
          <a
            href="https://wa.me/201551190990"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#F97316',
              fontWeight: 800,
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
              textShadow: '0 0 18px rgba(249,115,22,0.55), 0 0 40px rgba(249,115,22,0.25)',
              textDecoration: 'none',
              transition: 'text-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.textShadow = '0 0 28px rgba(249,115,22,0.9), 0 0 60px rgba(249,115,22,0.5)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.textShadow = '0 0 18px rgba(249,115,22,0.55), 0 0 40px rgba(249,115,22,0.25)'
            }}
          >
            ✦ Operations Managed by Dr. Hamza ✦
          </a>
        </div>
      </div>
    </footer>
  )
}
