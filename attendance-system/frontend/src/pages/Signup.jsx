import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { GLOBAL_CSS, AuthField, EyeBtn, Spinner, ToastRack, useToasts } from './Landing'

const INSTITUTIONS = [
  'Strathmore University','University of Nairobi','Kenyatta University',
  'JKUAT','Moi University','Egerton University','KCA University',
  'Daystar University','Kabarak University','Mount Kenya University','Other',
]

function parseError(err) {
  if (!err.response) return 'Network error — make sure the server is running.'
  const d = err.response?.data?.detail
  if (!d) return `Server error (${err.response.status}).`
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d[0]?.msg || 'Validation error.'
  return 'Something went wrong.'
}

function pwStrength(pw) {
  let s = 0
  if (pw.length >= 6)  s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}
const STR_COLOR = ['','#ef4444','#f97316','#eab308','#22c55e']
const STR_LABEL = ['','Weak','Fair','Good','Strong']

const STEP_CONTENT = [
  { tag:'Step 1 of 2', title:'Tell us about yourself', sub:'We\'ll personalise your workspace for your institution.', icon:'👤' },
  { tag:'Step 2 of 2', title:'Secure your account', sub:'Choose a unique username and a strong password.', icon:'🔒' },
]

export default function Signup() {
  const [form, setForm] = useState({ full_name:'', email:'', institution:'Strathmore University', username:'', password:'', confirm:'' })
  const [step,    setStep]    = useState(1)
  const [errors,  setErrors]  = useState({})
  const [showPw,  setShowPw]  = useState(false)
  const [showCf,  setShowCf]  = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const { toasts, push, remove } = useToasts()

  const f = k => e => { setForm(p=>({...p,[k]:e.target.value})); setErrors(x=>({...x,[k]:''})) }
  const pw = form.password
  const str = pwStrength(pw)

  const goStep2 = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required.'
    setErrors(e)
    if (Object.keys(e).length) return
    setStep(2)
    push('info','Step 1 complete ✓','Now set your username and password.')
  }

  const submit = async ev => {
    ev.preventDefault()
    const e = {}
    if (!form.username.trim())          e.username = 'Username is required.'
    if (form.username.includes(' '))    e.username = 'No spaces in username.'
    if (pw.length < 6)                  e.password = 'At least 6 characters.'
    if (pw !== form.confirm)            e.confirm  = 'Passwords do not match.'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: form.username.trim(), password: pw,
        full_name: form.full_name.trim(), email: form.email.trim(),
        role: 'lecturer', school: form.institution,
      })
      const res = await api.post('/auth/login', { username: form.username.trim(), password: pw })
      login(res.data.access_token, res.data.user || { username: form.username, role:'lecturer', full_name: form.full_name, school: form.institution })
      push('success','Account created! 🎉',`Welcome aboard, ${form.full_name.split(' ')[0]}!`)
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch(err) {
      push('error','Registration failed', parseError(err))
    } finally { setLoading(false) }
  }

  const lc = STEP_CONTENT[step - 1]

  return (
    <div style={S.page}>
      <style>{GLOBAL_CSS}</style>
      <ToastRack toasts={toasts} remove={remove} />

      {/* ── Left panel ── */}
      <div style={S.left}>
        {/* Background effects */}
        {[{x:'15%',y:'25%',s:16,c:'rgba(255,255,255,.08)'},{x:'78%',y:'18%',s:12,c:'rgba(255,255,255,.06)'},{x:'25%',y:'72%',s:20,c:'rgba(255,255,255,.07)'},{x:'72%',y:'68%',s:10,c:'rgba(255,255,255,.09)'}].map((p,i)=>(
          <div key={i} style={{ position:'absolute', left:p.x, top:p.y, width:p.s, height:p.s, borderRadius:'50%', background:p.c, animation:`float${i%2+1} ${9+i*2}s ease-in-out infinite ${i}s`, filter:'blur(1px)', pointerEvents:'none' }} />
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-120, left:-80, width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 60%)', pointerEvents:'none' }} />

        <div style={S.leftInner}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
            <div style={{ width:36, height:36, background:'rgba(255,255,255,.2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'.72rem', color:'#fff' }}>IQ</div>
            <span style={{ fontWeight:700, fontSize:'1rem', color:'#fff', letterSpacing:'-.03em', fontFamily:"'Bricolage Grotesque',sans-serif" }}>AttendIQ</span>
          </div>

          {/* Dynamic content per step */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:16 }}>{lc.icon}</div>
            <div style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,.45)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:10 }}>{lc.tag}</div>
            <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(1.8rem,2.5vw,2.2rem)', fontWeight:800, color:'#fff', letterSpacing:'-.04em', lineHeight:1.15, marginBottom:10 }}>{lc.title}</h1>
            <p style={{ fontSize:'.86rem', color:'rgba(255,255,255,.5)', lineHeight:1.8, marginBottom:36, maxWidth:280 }}>{lc.sub}</p>

            {/* Step indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {[1,2].map(n=>(
                <div key={n} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background: step>=n?'rgba(255,255,255,.95)':'rgba(255,255,255,.12)', border:`2px solid ${step>=n?'#fff':'rgba(255,255,255,.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'.72rem', fontWeight:700, color: step>=n?'#1d4ed8':'rgba(255,255,255,.35)', transition:'all .35s' }}>
                    {step>n ? '✓' : n}
                  </div>
                  {n<2 && <div style={{ width:44, height:2, background: step>1?'rgba(255,255,255,.8)':'rgba(255,255,255,.15)', borderRadius:1, transition:'background .4s' }} />}
                </div>
              ))}
            </div>

            {/* Benefits list */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:36 }}>
              {['Free forever for lecturers','Works on any device','No app install needed'].map((t,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:9, fontSize:'.78rem', color:'rgba(255,255,255,.55)' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,.2)', border:'1px solid rgba(34,197,94,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.58rem', color:'#4ade80', flexShrink:0 }}>✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:20 }}>
            <p style={{ fontSize:'.8rem', color:'rgba(255,255,255,.45)', lineHeight:1.75, fontStyle:'italic', marginBottom:7 }}>"Setting up my first class took 3 minutes. Marking 40 students takes under 30 seconds."</p>
            <p style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,.28)', letterSpacing:'.04em' }}>Prof. Samuel Ochieng · University of Nairobi</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={S.right}>
        <div style={S.formCard}>
          {/* Back */}
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#64748b', textDecoration:'none', fontSize:'.76rem', marginBottom:28, fontFamily:"'Space Grotesk',sans-serif", transition:'color .14s' }}
            onMouseEnter={e=>e.currentTarget.style.color='#2563eb'}
            onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 2L3 6.5 8 11"/></svg>
            Back to AttendIQ
          </Link>

          {/* Progress bar */}
          <div style={{ display:'flex', gap:5, marginBottom:28 }}>
            {[1,2].map(n=>(
              <div key={n} style={{ flex:1, height:3, borderRadius:2, background: step>=n?'#2563eb':'rgba(37,99,235,.12)', transition:'background .35s' }} />
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step===1 && (
            <div style={{ animation:'fadeUp .4s ease' }}>
              <div style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'#2563eb', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Create account · step 1</div>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'1.65rem', fontWeight:800, color:'#0f172a', letterSpacing:'-.04em', marginBottom:6 }}>Your details</h2>
              <p style={{ fontSize:'.8rem', color:'#64748b', marginBottom:24 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Sign in →</Link>
              </p>

              <AuthField label="Full name" error={errors.full_name}>
                <input className="au-i" type="text" placeholder="e.g. Dr. Jane Mwangi" autoFocus
                  value={form.full_name} onChange={f('full_name')} />
              </AuthField>

              <AuthField label={<>Email <span style={{ color:'#94a3b8', fontWeight:400 }}>(optional)</span></>}>
                <input className="au-i" type="email" placeholder="you@university.edu"
                  value={form.email} onChange={f('email')} />
              </AuthField>

              <AuthField label="Institution" style={{ marginBottom:24 }}>
                <select className="au-i" value={form.institution} onChange={f('institution')}>
                  {INSTITUTIONS.map(i=><option key={i}>{i}</option>)}
                </select>
              </AuthField>

              <button className="au-btn" type="button" onClick={goStep2}>Continue →</button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step===2 && (
            <div style={{ animation:'fadeUp .4s ease' }}>
              <div style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'#2563eb', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Create account · step 2</div>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'1.65rem', fontWeight:800, color:'#0f172a', letterSpacing:'-.04em', marginBottom:6 }}>Set your password</h2>
              <p style={{ fontSize:'.8rem', color:'#64748b', marginBottom:24 }}>Almost done — just set your login credentials.</p>

              <AuthField label="Username" error={errors.username} hint="No spaces · used to sign in">
                <input className="au-i" type="text" placeholder="e.g. dr.mwangi" autoFocus autoComplete="username"
                  value={form.username} onChange={f('username')} />
              </AuthField>

              <AuthField label="Password" error={errors.password}>
                <div style={{ position:'relative' }}>
                  <input className="au-i" type={showPw?'text':'password'} placeholder="Minimum 6 characters" autoComplete="new-password" style={{ paddingRight:40 }}
                    value={pw} onChange={f('password')} />
                  <EyeBtn open={showPw} toggle={() => setShowPw(v=>!v)} />
                </div>
                {/* Strength meter */}
                {pw.length>0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                      {[1,2,3,4].map(n=>(
                        <div key={n} style={{ flex:1, height:3, borderRadius:2, background: n<=str ? STR_COLOR[str] : 'rgba(37,99,235,.1)', transition:'background .25s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color: str>0 ? STR_COLOR[str] : '#94a3b8' }}>{STR_LABEL[str]}</div>
                  </div>
                )}
              </AuthField>

              <AuthField label="Confirm password" error={errors.confirm}>
                <div style={{ position:'relative' }}>
                  <input className="au-i" type={showCf?'text':'password'} placeholder="Repeat your password" autoComplete="new-password" style={{ paddingRight:40 }}
                    value={form.confirm} onChange={f('confirm')} />
                  <EyeBtn open={showCf} toggle={() => setShowCf(v=>!v)} />
                </div>
              </AuthField>

              <div style={{ display:'flex', gap:9, marginTop:4 }}>
                <button className="au-ghost" type="button" style={{ flex:'0 0 auto', width:'auto', padding:'10px 18px' }} onClick={() => { setStep(1); setErrors({}) }}>← Back</button>
                <button className="au-btn" type="button" onClick={submit} disabled={loading} style={{ flex:1 }}>
                  {loading ? <><Spinner /> Creating…</> : 'Create account →'}
                </button>
              </div>

              <p style={{ textAlign:'center', marginTop:14, fontSize:'.68rem', color:'#94a3b8', lineHeight:1.6 }}>
                By creating an account you agree to use AttendIQ responsibly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  page: { minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:"'Space Grotesk',sans-serif" },
  left: { background:'linear-gradient(150deg,#0f172a 0%,#1e3a8a 45%,#1d4ed8 100%)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' },
  leftInner: { flex:1, display:'flex', flexDirection:'column', padding:'44px 52px', position:'relative', zIndex:1 },
  right: { background:'#f8faff', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 52px' },
  formCard: { width:'100%', maxWidth:400 },
}