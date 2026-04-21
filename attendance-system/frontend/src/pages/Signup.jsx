import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { Logo, Field, EyeBtn, Spin, Divider, Toast, CSS, S } from './Login'

const INSTITUTIONS = [
  'Strathmore University', 'University of Nairobi', 'Kenyatta University',
  'JKUAT', 'Moi University', 'Egerton University', 'KCA University',
  'Daystar University', 'Kabarak University', 'Mount Kenya University', 'Other',
]

function parseError(err) {
  if (!err.response) return 'Network error — make sure the server is running.'
  const d = err.response?.data?.detail
  if (!d) return `Server error (${err.response.status}).`
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d[0]?.msg || 'Validation error.'
  return 'Something went wrong.'
}

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

/* password strength: 0-4 */
function strength(pw) {
  let s = 0
  if (pw.length >= 6)  s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}
const STRENGTH_COLOR = ['', '#b84c2a', '#c8760a', '#a7b840', '#4a7a55']
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']

const LEFT_CONTENT = [
  { step: 1, tag: 'Step 1 of 2 — your details',     title: 'Tell us about\nyourself', sub: 'We\'ll set you up with the right defaults for your institution.' },
  { step: 2, tag: 'Step 2 of 2 — your credentials', title: 'Secure your\naccount',    sub: 'Choose a username and a strong password.' },
]

export default function Signup() {
  const [form, setForm]   = useState({ full_name: '', email: '', institution: 'Strathmore University', username: '', password: '', confirm: '' })
  const [step, setStep]   = useState(1)
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()
  const { toasts, push, remove } = useToasts()

  const pw = form.password
  const pwStr = strength(pw)

  const f = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(x => ({ ...x, [k]: '' })) }

  /* step 1 validation */
  const goStep2 = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Please enter your full name.'
    setErrors(e)
    if (Object.keys(e).length) return
    setStep(2)
    push('info', 'Step 1 complete', 'Now choose your username and password.')
  }

  /* final submit */
  const submit = async ev => {
    ev.preventDefault()
    const e = {}
    if (!form.username.trim())          e.username = 'Username cannot be empty.'
    if (form.username.includes(' '))    e.username = 'Username cannot contain spaces.'
    if (pw.length < 6)                  e.password = 'Password must be at least 6 characters.'
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
      login(res.data.access_token, res.data.user || { username: form.username, role: 'lecturer', full_name: form.full_name, school: form.institution })
      push('success', 'Account created!', `Welcome, ${form.full_name.split(' ')[0]}!`)
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      push('error', 'Registration failed', parseError(err))
    } finally {
      setLoading(false)
    }
  }

  const lc = LEFT_CONTENT[step - 1]

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={S.toastRack}>
        {toasts.map(t => <Toast key={t.id} t={t} onClose={() => remove(t.id)} />)}
      </div>

      {/* ── Left panel — changes content per step ── */}
      <div style={S.left}>
        <div style={S.glow1} /><div style={S.glow2} />
        <div style={S.leftInner}>
          <Logo />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0 24px' }}>
            <div style={S.tag} key={`tag-${step}`} className="au-fade-up">{lc.tag}</div>
            <h1 style={{ ...S.heroTitle, whiteSpace: 'pre-line' }} key={`h-${step}`} className="au-fade-up">
              {lc.title.split('\n').map((ln, i) => (
                <span key={i}>{i === 1 ? <em style={{ color: '#c8760a', fontStyle: 'italic' }}>{ln}</em> : ln}{i < 1 && <br />}</span>
              ))}
            </h1>
            <p style={{ ...S.heroPara, maxWidth: 280 }} key={`sub-${step}`} className="au-fade-up">{lc.sub}</p>

            {/* Progress orbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32 }}>
              {[1, 2].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: step >= n ? '#c8760a' : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${step >= n ? '#c8760a' : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', fontWeight: 600,
                    color: step >= n ? '#fff' : 'rgba(255,255,255,0.35)',
                    transition: 'all .3s',
                  }}>
                    {step > n ? '✓' : n}
                  </div>
                  {n < 2 && <div style={{ width: 40, height: 2, background: step > 1 ? '#c8760a' : 'rgba(255,255,255,0.1)', borderRadius: 1, transition: 'background .4s' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={S.testi}>
            <p style={S.testiQ}>"Setting up my first class took 3 minutes. Marking 40 students now takes under 30 seconds."</p>
            <p style={S.testiBy}>Prof. Samuel Ochieng · University of Nairobi</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={S.right}>
        <div style={S.formWrap}>

          {/* Step indicator bar */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
            {[1, 2].map(n => (
              <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= n ? '#c8760a' : 'rgba(30,26,20,0.12)', transition: 'background .35s' }} />
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div key="s1" className="au-fade-up">
              <div style={S.fhLabel}>Create account — step 1</div>
              <h2 style={S.fhTitle}>Your details</h2>
              <p style={S.fhSub}>
                Already have an account?{' '}
                <Link to="/login" style={S.link}>Sign in →</Link>
              </p>

              <Field label="Full name" error={errors.full_name}>
                <input className="au-fi" type="text" placeholder="e.g. Dr. Jane Mwangi"
                  autoFocus value={form.full_name} onChange={f('full_name')} />
              </Field>

              <Field label={<>Email <span style={{ color: '#c4b8a8' }}>(optional)</span></>}>
                <input className="au-fi" type="email" placeholder="you@university.edu"
                  value={form.email} onChange={f('email')} />
              </Field>

              <Field label="Institution" style={{ marginBottom: 24 }}>
                <select className="au-fi" value={form.institution} onChange={f('institution')}>
                  {INSTITUTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>

              <button className="au-btn-main" type="button" onClick={goStep2}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div key="s2" className="au-fade-up">
              <div style={S.fhLabel}>Create account — step 2</div>
              <h2 style={S.fhTitle}>Set your password</h2>
              <p style={S.fhSub}>Almost done — just set your login credentials.</p>

              <Field label="Username" error={errors.username}>
                <input className="au-fi" type="text" placeholder="e.g. dr.mwangi"
                  autoFocus autoComplete="username"
                  value={form.username} onChange={f('username')} />
                <div style={{ fontSize: '0.62rem', color: '#9e9080', fontFamily: "'DM Mono',monospace", marginTop: 4 }}>
                  No spaces — used to sign in.
                </div>
              </Field>

              <Field label="Password" error={errors.password}>
                <div style={{ position: 'relative' }}>
                  <input className="au-fi" type={showPw ? 'text' : 'password'}
                    placeholder="Minimum 6 characters" autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                    value={pw} onChange={f('password')} />
                  <EyeBtn open={showPw} toggle={() => setShowPw(v => !v)} />
                </div>
                {/* Strength meter */}
                {pw.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= pwStr ? STRENGTH_COLOR[pwStr] : 'rgba(30,26,20,0.12)', transition: 'background .25s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.62rem', fontFamily: "'DM Mono',monospace", color: pwStr > 0 ? STRENGTH_COLOR[pwStr] : '#9e9080' }}>
                      {STRENGTH_LABEL[pwStr]}
                    </div>
                  </div>
                )}
              </Field>

              <Field label="Confirm password" error={errors.confirm} style={{ marginBottom: 22 }}>
                <div style={{ position: 'relative' }}>
                  <input className="au-fi" type={showCf ? 'text' : 'password'}
                    placeholder="Repeat your password" autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                    value={form.confirm} onChange={f('confirm')} />
                  <EyeBtn open={showCf} toggle={() => setShowCf(v => !v)} />
                </div>
              </Field>

              <div style={{ display: 'flex', gap: 9, marginBottom: 0 }}>
                <button className="au-btn-ghost" type="button"
                  style={{ flex: '0 0 auto', width: 'auto', padding: '10px 20px' }}
                  onClick={() => { setStep(1); setErrors({}) }}>
                  ← Back
                </button>
                <button className="au-btn-main" type="button" onClick={submit}
                  disabled={loading} style={{ flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><Spin />Creating…</> : 'Create account →'}
                </button>
              </div>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.68rem', color: '#c4b8a8', lineHeight: 1.6 }}>
                By creating an account you agree to use AttendIQ responsibly.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}