import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { GLOBAL_CSS, AuthField, EyeBtn, Spinner, ToastRack, useToasts } from './Landing'

const STATS = [
  { color:'#60a5fa', val:'10s', label:'to mark a full class' },
  { color:'#34d399', val:'75%', label:'threshold tracking built-in' },
  { color:'#a78bfa', val:'QR',  label:'scan-to-attend per session' },
]

const EXTRA_CSS = `
  @keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-30px)}}
  @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-15px,20px)}}
  @media(max-width:700px){
    .login-grid{grid-template-columns:1fr!important}
    .login-left{display:none!important}
    .login-right{padding:32px 24px!important}
  }
`

export default function Login() {
  const [form,    setForm]    = useState({ username:'', password:'' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const { toasts, push, remove } = useToasts()

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(x => ({ ...x, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Please enter your username.'
    if (!form.password)        e.password = 'Please enter your password.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res  = await api.post('/auth/login', form)
      const user = res.data.user || { username: form.username, role: 'lecturer', full_name: form.username }
      login(res.data.access_token, user)
      push('success', 'Welcome back!', 'Taking you to your dashboard…')
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
    <div className="login-grid" style={S.page}>
      <style>{GLOBAL_CSS}</style>
      <style>{EXTRA_CSS}</style>
      <ToastRack toasts={toasts} remove={remove} />

      {/* ── Left panel ───────────────────────────────────────────────────── */}
      <div className="login-left" style={S.left}>
        {/* Floating particles */}
        {[
          { x:'10%', y:'20%', s:14, a:'float1 8s ease-in-out infinite',      c:'rgba(255,255,255,.10)' },
          { x:'80%', y:'15%', s:10, a:'float2 10s ease-in-out infinite',     c:'rgba(255,255,255,.08)' },
          { x:'20%', y:'75%', s:18, a:'float1 12s ease-in-out infinite 2s',  c:'rgba(255,255,255,.07)' },
          { x:'75%', y:'70%', s:8,  a:'float2 9s ease-in-out infinite 1s',   c:'rgba(255,255,255,.10)' },
        ].map((p, i) => (
          <div key={i} style={{ position:'absolute', left:p.x, top:p.y, width:p.s, height:p.s, borderRadius:'50%', background:p.c, animation:p.a, filter:'blur(1px)', pointerEvents:'none' }} />
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize:'52px 52px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,.06) 0%,transparent 65%)', pointerEvents:'none' }} />

        <div style={S.leftInner}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
            <div style={{ width:36, height:36, background:'rgba(255,255,255,.2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'.72rem', color:'#fff', backdropFilter:'blur(8px)' }}>IQ</div>
            <span style={{ fontWeight:700, fontSize:'1rem', color:'#fff', letterSpacing:'-.03em', fontFamily:"'Bricolage Grotesque',sans-serif" }}>AttendIQ</span>
          </div>

          {/* Hero copy */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:'.62rem', fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,.5)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:12 }}>University attendance platform</div>
            <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(1.9rem,2.8vw,2.4rem)', fontWeight:800, color:'#fff', letterSpacing:'-.04em', lineHeight:1.15, marginBottom:12 }}>
              Mark attendance<br />
              <span style={{ color:'rgba(255,255,255,.55)', fontWeight:400, fontStyle:'italic', fontSize:'.85em' }}>in under 10 seconds</span>
            </h1>
            <p style={{ fontSize:'.86rem', color:'rgba(255,255,255,.55)', lineHeight:1.8, marginBottom:32, maxWidth:280 }}>
              Built for lecturers who value their time. No clipboards, no paper lists, no frustration.
            </p>

            {/* Stat pills */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:11, padding:'10px 14px', backdropFilter:'blur(8px)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, boxShadow:`0 0 8px ${s.color}`, flexShrink:0 }} />
                  <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'#fff', minWidth:44, letterSpacing:'-.03em' }}>{s.val}</div>
                  <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.45)', fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:20, marginTop:24 }}>
            <p style={{ fontSize:'.82rem', color:'rgba(255,255,255,.5)', lineHeight:1.75, fontStyle:'italic', marginBottom:8 }}>
              "AttendIQ cut my admin time in half. I spend less than a minute on attendance now."
            </p>
            <p style={{ fontSize:'.62rem', fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,.3)', letterSpacing:'.04em' }}>
              Dr. Jane Mwangi · Strathmore University
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="login-right" style={S.right}>
        <div style={S.formCard}>
          {/* Back to landing */}
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#64748b', textDecoration:'none', fontSize:'.76rem', marginBottom:28, fontFamily:"'Space Grotesk',sans-serif", transition:'color .14s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 2L3 6.5 8 11"/></svg>
            Back to AttendIQ
          </Link>

          <div style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'#2563eb', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Welcome back</div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'1.7rem', fontWeight:800, color:'#0f172a', letterSpacing:'-.04em', marginBottom:6 }}>Sign in</h2>
          <p style={{ fontSize:'.8rem', color:'#64748b', marginBottom:28 }}>
            No account?{' '}
            <Link to="/signup" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Create one free →</Link>
          </p>

          <form onSubmit={submit} noValidate>
            <AuthField label="Username" error={errors.username}>
              <input
                className="au-i" type="text" placeholder="Your username"
                autoFocus autoComplete="username"
                value={form.username} onChange={set('username')}
              />
            </AuthField>

            <AuthField label="Password" error={errors.password}>
              <div style={{ position:'relative' }}>
                <input
                  className="au-i" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ paddingRight:40 }}
                  value={form.password} onChange={set('password')}
                />
                <EyeBtn open={showPw} toggle={() => setShowPw(v => !v)} />
              </div>
            </AuthField>

            {/* Forgot password link */}
            <div style={{ textAlign:'right', marginTop:-8, marginBottom:16 }}>
              <Link to="/forgot-password" style={{ fontSize:'.72rem', color:'#2563eb', textDecoration:'none', fontFamily:"'Space Grotesk',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                Forgot password?
              </Link>
            </div>

            <button className="au-btn" type="submit" disabled={loading}>
              {loading ? <><Spinner /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(37,99,235,.1)' }} />
            <span style={{ fontSize:'.65rem', color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>or</span>
            <div style={{ flex:1, height:1, background:'rgba(37,99,235,.1)' }} />
          </div>

          <p style={{ textAlign:'center', fontSize:'.78rem', color:'#64748b' }}>
            New to AttendIQ?{' '}
            <Link to="/signup" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const S = {
  page:      { minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:"'Space Grotesk',sans-serif" },
  left:      { background:'linear-gradient(150deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' },
  leftInner: { flex:1, display:'flex', flexDirection:'column', padding:'44px 52px', position:'relative', zIndex:1 },
  right:     { background:'#f8faff', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 52px' },
  formCard:  { width:'100%', maxWidth:400 },
}