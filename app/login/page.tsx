'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, User, LogIn, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'إسم المستخدم أو كلمة المرور غير صحيحة')
      }

      // Success, redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', direction: 'rtl' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={{ width: '100%', maxWidth: 420, padding: '2.5rem', background: '#FFFFFF', borderRadius: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={30} color="#D4AF37" strokeWidth={1.8} />
            </div>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1D1D1F', marginBottom: '0.4rem' }}>ألمظ استور</h1>
          <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.9rem' }}>تسجيل الدخول للوحة التحكم</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#dc2626', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center' }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1D1D1F', display: 'block', marginBottom: '0.4rem' }}>اسم المستخدم</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', border: '1px solid rgba(29,29,31,0.14)', borderRadius: 12, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                placeholder="admin_almaz"
              />
              <User size={18} color="rgba(29,29,31,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1D1D1F', display: 'block', marginBottom: '0.4rem' }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', border: '1px solid rgba(29,29,31,0.14)', borderRadius: 12, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                placeholder="••••••••"
                dir="ltr"
              />
              <Lock size={18} color="rgba(29,29,31,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.9rem', fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 20px rgba(212,175,55,0.25)', transition: 'transform 0.2s', opacity: loading ? 0.8 : 1 }}
          >
            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <><LogIn size={20} /> دخول للوحة التحكم</>}
          </button>
        </form>
      </motion.div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
