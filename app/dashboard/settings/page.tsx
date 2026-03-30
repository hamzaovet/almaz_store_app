'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Eye, EyeOff, Plus, Trash2, Check, Loader2 } from 'lucide-react'

type AdminUser = { id: string; name: string; username: string; role: 'مدير' | 'كاشير'; email: string }

export default function SettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users)
      })
      .finally(() => setLoadingUsers(false))
  }, [])

  // Password form
  const [pwForm, setPwForm]   = useState({ old: '', new1: '', new2: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  // Add user form
  const [addForm, setAddForm]   = useState({ name: '', email: '', username: '', password: '', role: 'كاشير' as AdminUser['role'] })
  const [showAddForm, setShowAddForm] = useState(false)
  const [userSaved, setUserSaved]     = useState(false)

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.new1 !== pwForm.new2) { setPwError('كلمتا المرور الجديدتان غير متطابقتين'); return }
    if (pwForm.new1.length < 6) { setPwError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    setPwSaved(true)
    setPwForm({ old: '', new1: '', new2: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.name || !addForm.email || !addForm.username || !addForm.password) return

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          role: addForm.role.trim() // Ensure no leading spaces
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers([data.user, ...users])
        setAddForm({ name: '', email: '', username: '', password: '', role: 'كاشير' })
        setShowAddForm(false)
        setUserSaved(true)
        setTimeout(() => setUserSaved(false), 3000)
      } else {
        alert(data.error || 'فشل في إضافة المستخدم')
      }
    } catch (err) {
      alert('فشل في إضافة المستخدم')
    }
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(29,29,31,0.06)' }
  const inp: React.CSSProperties  = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid rgba(29,29,31,0.14)', borderRadius: 10, fontSize: '0.92rem', fontFamily: 'inherit', color: '#1D1D1F', outline: 'none', background: '#fafafa', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>الإعدادات</p>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>إعدادات النظام</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Card 1: Change Password ─────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#D4AF37" strokeWidth={1.8} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>تغيير كلمة المرور</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>تأكد من استخدام كلمة مرور قوية لأمان النظام</p>
            </div>
          </div>

          {pwSaved && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> تم تحديث كلمة المرور بنجاح
            </div>
          )}
          {pwError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
              {pwError}
            </div>
          )}

          <form onSubmit={handlePwSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>كلمة المرور الحالية</label>
              <div style={{ position: 'relative' }}>
                <input required type={showOld ? 'text' : 'password'} value={pwForm.old} onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })} style={{ ...inp, paddingLeft: '2.5rem' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.4)', display: 'flex' }}>
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {[
              { label: 'كلمة المرور الجديدة', key: 'new1' },
              { label: 'تأكيد كلمة المرور',   key: 'new2' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showNew ? 'text' : 'password'} value={pwForm[f.key as 'new1' | 'new2']} onChange={(e) => setPwForm({ ...pwForm, [f.key]: e.target.value })} style={{ ...inp, paddingLeft: '2.5rem' }} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.4)', display: 'flex' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                حفظ كلمة المرور
              </button>
            </div>
          </form>
        </div>

        {/* ── Card 2: User Management ─────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#6366f1" strokeWidth={1.8} />
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>إدارة المستخدمين</h2>
                <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>{users.length} مستخدمين مسجلين</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '0.62rem 1.1rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={16} /> إضافة مستخدم
            </button>
          </div>

          {userSaved && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> تم إضافة المستخدم بنجاح
            </div>
          )}

          {/* Add user form */}
          {showAddForm && (
            <form onSubmit={handleAddUser} style={{ background: '#f8f8fa', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', border: '1px solid rgba(99,102,241,0.15)' }}>
              {[
                { label: 'الاسم الكامل', key: 'name',  type: 'text',  placeholder: 'Ahmed Nabil' },
                { label: 'البريد الإلكتروني', key: 'email', type: 'email', placeholder: 'user@almaz.eg' },
                { label: 'اسم المستخدم', key: 'username', type: 'text', placeholder: 'ahmed_nabil' },
                { label: 'كلمة المرور', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                  <input required type={f.type} placeholder={f.placeholder} value={addForm[f.key as keyof typeof addForm]} onChange={(e) => setAddForm({ ...addForm, [f.key]: e.target.value })} style={inp} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>الصلاحية</label>
                <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value as AdminUser['role'] })} style={inp}>
                  <option value="مدير">مدير</option>
                  <option value="كاشير">كاشير</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '0.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>إضافة</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, background: 'rgba(29,29,31,0.06)', color: '#1D1D1F', border: 'none', borderRadius: 10, padding: '0.65rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>إلغاء</button>
              </div>
            </form>
          )}

          {/* Users list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderRadius: 12, background: '#fafafa', border: '1px solid rgba(29,29,31,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.role.trim() === 'مدير' ? 'rgba(212,175,55,0.15)' : 'rgba(99,102,241,0.12)', border: `1px solid ${u.role.trim() === 'مدير' ? 'rgba(212,175,55,0.25)' : 'rgba(99,102,241,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: u.role.trim() === 'مدير' ? '#D4AF37' : '#6366f1' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1D1D1F', fontSize: '0.92rem' }}>{u.name}</p>
                    <p style={{ fontSize: '0.76rem', color: 'rgba(29,29,31,0.45)', direction: 'ltr', textAlign: 'right' }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ padding: '0.22rem 0.7rem', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, background: u.role.trim() === 'مدير' ? 'rgba(212,175,55,0.12)' : 'rgba(99,102,241,0.1)', color: u.role.trim() === 'مدير' ? '#D4AF37' : '#6366f1' }}>
                    {u.role.trim()}
                  </span>
                  {u.username !== 'admin_almaz' && (
                    <button
                      onClick={async () => {
                        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                          await fetch(`/api/users?id=${u.id}`, { method: 'DELETE' })
                          setUsers(users.filter((x) => x.id !== u.id))
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.3)', display: 'flex', padding: 4, transition: 'color 0.2s' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#dc2626')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(29,29,31,0.3)')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
