import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = (type, title, msg) => {
    const id = Date.now()
    setToasts(t => [...t, { id, type, title, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200)
  }
  const remove = id => setToasts(t => t.filter(x => x.id !== id))
  return { toasts, push, remove }
}

const STATS = [
  { color: '#c8760a', val: '10s',  label: 'to mark a full class' },
  { color: '#7ab87e', val: '75%',  label: 'threshold tracking built-in' },
  { color: '#d4795a', val: 'QR',   label: 'scan-to-attend per session' },
]

export default function Login() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const { login }  = useAuthStore()
  const navigate   = useNavigate()
  const { toasts, push, remove } = useToasts()

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Please enter your username.'
    if (!form.password)        e.password = 'Please enter your password.'
    setErrors(e); return Object.keys(e).length === 0
  }

  const submit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res  = await api.post('/auth/login', form)
      const user = res.data.user || { username: form.username, role: 'lecturer', full_name: form.username }
      login(res.data.access_token, user)
      push('success', 'Welcome back!', 'Redirecting to your dashboard…')
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      const msg = err.response?.data?.detail
      push('error', 'Sign in failed', typeof msg === 'string' ? msg : 'Invalid username or password.')
      setForm(f => ({ ...f, password: '' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={S.toastRack}>
        {toasts.map(t => <Toast key={t.id} t={t} onClose={() => remove(t.id)} />)}
      </div>

      {/* ── Left decorative panel ── */}
      <div style={S.left}>
        <div style={S.glow1} /><div style={S.glow2} />
        <div style={S.leftInner}>
          <Logo />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0 24px' }}>
            <div style={S.tag}>University attendance platform</div>
            <h1 style={S.heroTitle}>
              Mark attendance<br />in{' '}
              <em style={{ color: '#c8760a', fontStyle: 'italic' }}>10 seconds</em>
            </h1>
            <p style={S.heroPara}>
              Built for lecturers who value their time. No clipboards, no paper lists, no frustration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
              {STATS.map((s, i) => (
                <div key={i} style={S.statPill}>
                  <div style={{ ...S.statDot, background: s.color }} />
                  <div style={S.statVal}>{s.val}</div>
                  <div style={S.statLbl}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={S.testi}>
            <p style={S.testiQ}>"AttendIQ cut my admin time in half. I spend less than a minute on attendance now."</p>
            <p style={S.testiBy}>Dr. Jane Mwangi · Strathmore University</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={S.right}>
        <div style={S.formWrap} className="au-fade-up">
          <div style={S.fhLabel}>Welcome back</div>
          <h2 style={S.fhTitle}>
            Sign in to your<br />
            <em style={{ fontStyle: 'italic', color: '#6b6050' }}>dashboard</em>
          </h2>
          <p style={S.fhSub}>
            Don't have an account?{' '}
            <Link to="/signup" style={S.link}>Create one free →</Link>
          </p>

          <form onSubmit={submit} noValidate>
            <Field label="Username" error={errors.username}>
              <input className="au-fi" type="text" placeholder="Your username"
                autoFocus autoComplete="username"
                value={form.username}
                onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setErrors(x => ({ ...x, username: '' })) }} />
            </Field>

            <Field label="Password" error={errors.password} style={{ marginBottom: 22 }}>
              <div style={{ position: 'relative' }}>
                <input className="au-fi" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(x => ({ ...x, password: '' })) }} />
                <EyeBtn open={showPw} toggle={() => setShowPw(v => !v)} />
              </div>
            </Field>

            <button type="submit" disabled={loading} className="au-btn-main" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <><Spin />Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <Divider />
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9e9080' }}>
            New to AttendIQ?{' '}
            <Link to="/signup" style={S.link}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Shared sub-components ── */
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 38, height: 38, background: '#c8760a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: '0.72rem', color: '#fff' }}>IQ</div>
      <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em' }}>AttendIQ</span>
    </div>
  )
}

export function Field({ label, error, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={S.label}>{label}</label>
      {children}
      {error && <div style={S.fieldErr}>{error}</div>}
    </div>
  )
}

export function EyeBtn({ open, toggle }) {
  return (
    <button type="button" onClick={toggle} style={S.eyeBtn} tabIndex={-1}>
      {open
        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><line x1="2" y1="2" x2="14" y2="14"/></svg>
        : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
      }
    </button>
  )
}

export function Spin() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'au-spin .6s linear infinite', marginRight: 7, verticalAlign: 'middle' }} />
}

export function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(30,26,20,0.12)' }} />
      <span style={{ fontSize: '0.68rem', color: '#9e9080', fontFamily: "'DM Mono',monospace" }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(30,26,20,0.12)' }} />
    </div>
  )
}

export function Toast({ t, onClose }) {
  const colors = { success: '#4a7a55', error: '#b84c2a', info: '#c8760a' }
  const icons  = { success: '✓', error: '✕', info: '!' }
  return (
    <div className="au-toast-in" style={{ ...S.toast, borderLeft: `3px solid ${colors[t.type]}` }}>
      <div style={{ ...S.toastIcon, background: colors[t.type] + '18', color: colors[t.type] }}>{icons[t.type]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#1e1a14', marginBottom: 1 }}>{t.title}</div>
        <div style={{ fontSize: '0.73rem', color: '#6b6050', lineHeight: 1.4 }}>{t.msg}</div>
      </div>
      <button onClick={onClose} style={S.toastClose}>×</button>
    </div>
  )
}

/* ── CSS ── */
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;}html,body{margin:0;padding:0;}
body{background:#1e1a14;font-family:'DM Sans',sans-serif;}
::selection{background:#c8760a;color:#fff;}
.au-fi{width:100%;padding:10px 13px;background:#ede8de;border:1px solid rgba(30,26,20,0.18);border-radius:8px;color:#1e1a14;font-family:'DM Sans',sans-serif;font-size:0.875rem;outline:none;transition:border-color .15s,box-shadow .15s;}
.au-fi:focus{border-color:#c8760a;box-shadow:0 0 0 3px rgba(200,118,10,0.14);}
.au-fi::placeholder{color:#c4b8a8;}
select.au-fi{cursor:pointer;} .au-fi option{background:#ede8de;color:#1e1a14;}
.au-btn-main{width:100%;padding:11px 16px;background:#c8760a;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.88rem;font-weight:600;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:6px;}
.au-btn-main:hover:not(:disabled){background:#a85f06;transform:translateY(-1px);box-shadow:0 6px 20px rgba(200,118,10,0.24);}
.au-btn-main:disabled{cursor:not-allowed;}
.au-btn-ghost{width:100%;padding:10px 16px;background:transparent;color:#6b6050;border:1px solid rgba(30,26,20,0.18);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:500;cursor:pointer;transition:all .15s;}
.au-btn-ghost:hover{border-color:rgba(30,26,20,0.35);color:#1e1a14;}
.au-fade-up{animation:au-fadeUp .45s cubic-bezier(.4,0,.2,1) both;}
.au-toast-in{animation:au-toastIn .3s cubic-bezier(.4,0,.2,1) both;}
@keyframes au-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes au-toastIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes au-spin{to{transform:rotate(360deg)}}
`

/* ── Shared left-panel styles (also used by Signup) ── */
export const S = {
  page: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'DM Sans',sans-serif" },
  left: { background: '#1e1a14', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  leftInner: { flex: 1, display: 'flex', flexDirection: 'column', padding: '44px 52px', position: 'relative', zIndex: 1, maxWidth: 560, width: '100%', margin: '0 auto' },
  glow1: { position: 'absolute', top: -100, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,118,10,0.1) 0%,transparent 70%)', pointerEvents: 'none' },
  glow2: { position: 'absolute', bottom: -80, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(184,76,42,0.07) 0%,transparent 70%)', pointerEvents: 'none' },
  tag: { fontSize: '0.6rem', fontFamily: "'DM Mono',monospace", color: 'rgba(200,118,10,0.75)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 },
  heroTitle: { fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.9rem,3vw,2.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 },
  heroPara: { fontSize: '0.86rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginTop: 12, maxWidth: 300 },
  statPill: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' },
  statDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  statVal: { fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', minWidth: 44 },
  statLbl: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" },
  testi: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 },
  testiQ: { fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, fontStyle: 'italic', fontFamily: "'Playfair Display',serif" },
  testiBy: { fontSize: '0.62rem', fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.28)', marginTop: 8, letterSpacing: '0.04em' },
  right: { background: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 52px' },
  formWrap: { width: '100%', maxWidth: 390 },
  fhLabel: { fontSize: '0.6rem', fontFamily: "'DM Mono',monospace", color: '#c8760a', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 },
  fhTitle: { fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.6rem,2.5vw,2rem)', fontWeight: 700, color: '#1e1a14', letterSpacing: '-0.03em', lineHeight: 1.15 },
  fhSub: { fontSize: '0.8rem', color: '#9e9080', marginTop: 8, marginBottom: 26, lineHeight: 1.6 },
  label: { display: 'block', fontSize: '0.58rem', fontFamily: "'DM Mono',monospace", color: '#9e9080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 },
  fieldErr: { fontSize: '0.68rem', color: '#b84c2a', fontFamily: "'DM Mono',monospace", marginTop: 5 },
  eyeBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9e9080', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  link: { color: '#c8760a', fontWeight: 500, textDecoration: 'none' },
  toastRack: { position: 'fixed', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 999, pointerEvents: 'none' },
  toast: { background: '#faf7f2', border: '1px solid rgba(30,26,20,0.15)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 240, maxWidth: 300, pointerEvents: 'all', boxShadow: '0 4px 20px rgba(30,26,20,0.1)' },
  toastIcon: { width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700 },
  toastClose: { background: 'none', border: 'none', color: '#9e9080', cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0 },
}