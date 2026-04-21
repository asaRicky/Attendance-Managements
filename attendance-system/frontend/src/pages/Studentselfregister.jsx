import { useState, useEffect } from 'react'

const SCHOOLS = ['SCES','SBS','SIMS','SLS','SHC','SPH','SIBS','SENL']
const DEPTS   = { SCES:['CS','IT','EE','SE'], SBS:['BBA','MBA','ACC'], SIMS:['MIS','MTH','ACT'], SLS:['LLB','LLM'], SHC:['COM','DEV'], SPH:['PH'], SIBS:['BIB'], SENL:['ENV'] }

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function StudentSelfRegister() {
  const params     = new URLSearchParams(window.location.search)
  const initSchool = params.get('school') || 'SCES'
  const initDept   = params.get('department') || 'CS'
  const token      = params.get('token') || ''

  const [form, setForm] = useState({
    full_name:  '',
    student_id: '',
    school:     initSchool,
    department: initDept,
    year:       1,
    semester:   1,
    email:      '',
    phone:      '',
    gender:     'Male',
  })
  const [step,    setStep]    = useState('form')   // 'form' | 'success' | 'error'
  const [saving,  setSaving]  = useState(false)
  const [errMsg,  setErrMsg]  = useState('')
  const [touched, setTouched] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const touch = k    => setTouched(t => ({ ...t, [k]: true }))

  const errors = {
    full_name:  !form.full_name.trim()                       ? 'Full name is required' : '',
    student_id: !/^\d{6}$/.test(form.student_id)             ? 'Must be exactly 6 digits' : '',
    email:      form.email && !/\S+@\S+\.\S+/.test(form.email) ? 'Invalid email' : '',
  }
  const hasErrors = Object.values(errors).some(Boolean)

  async function handleSubmit() {
    setTouched({ full_name:true, student_id:true, email:true })
    if (hasErrors) return
    setSaving(true)
    setErrMsg('')
    try {
      const r = await fetch(`${API}/students/self-register`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ ...form, token }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Registration failed')
      setStep('success')
    } catch(e) {
      setErrMsg(e.message)
      setStep('error')
    } finally { setSaving(false) }
  }

  if (step === 'success') return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#b6f542" fillOpacity="0.15"/>
            <path d="M12 20l6 6 10-12" stroke="#b6f542" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={styles.successTitle}>You're registered!</h2>
        <p style={styles.successSub}>
          Your registration has been submitted and is waiting for your lecturer's approval.
          You'll be notified once it's confirmed.
        </p>
        <div style={styles.pill}>{form.full_name} · {form.student_id}</div>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#b6f542"/>
              <path d="M6 11l4 4 6-8" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={styles.brand}>AttendIQ</div>
            <div style={styles.brandSub}>Student Self-Registration</div>
          </div>
        </div>

        <p style={styles.desc}>
          Fill in your details below. Your lecturer will approve your registration shortly.
        </p>

        {errMsg && (
          <div style={styles.errBanner}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#f87171" strokeWidth="1.8"><circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 9.5v.5"/></svg>
            {errMsg}
          </div>
        )}

        <div style={styles.grid}>
          {/* Full Name */}
          <Field label="Full Name *" col="1/-1"
            error={touched.full_name && errors.full_name}>
            <input style={styles.input} placeholder="e.g. Alice Wanjiku"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              onBlur={() => touch('full_name')} />
          </Field>

          {/* Student ID */}
          <Field label="Student ID *" col="1/-1"
            error={touched.student_id && errors.student_id}
            hint="Your 6-digit registration number">
            <input style={{ ...styles.input, fontFamily:'monospace', letterSpacing:'0.15em', fontSize:'1.1rem' }}
              placeholder="123456" maxLength={6}
              value={form.student_id}
              onChange={e => set('student_id', e.target.value.replace(/\D/g,'').slice(0,6))}
              onBlur={() => touch('student_id')} />
          </Field>

          {/* School */}
          <Field label="School" col="1/2">
            <select style={styles.input} value={form.school}
              onChange={e => { set('school', e.target.value); set('department', (DEPTS[e.target.value]||[])[0]||'') }}>
              {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          {/* Department */}
          <Field label="Department" col="2/3">
            <select style={styles.input} value={form.department}
              onChange={e => set('department', e.target.value)}>
              {(DEPTS[form.school]||[]).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          {/* Year */}
          <Field label="Year" col="1/2">
            <select style={styles.input} value={form.year} onChange={e => set('year', Number(e.target.value))}>
              {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </Field>

          {/* Semester */}
          <Field label="Semester" col="2/3">
            <select style={styles.input} value={form.semester} onChange={e => set('semester', Number(e.target.value))}>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </Field>

          {/* Email */}
          <Field label="Email" col="1/-1"
            error={touched.email && errors.email}
            hint="Optional but recommended">
            <input style={styles.input} type="email" placeholder="you@strathmore.edu"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => touch('email')} />
          </Field>

          {/* Phone */}
          <Field label="Phone" col="1/2">
            <input style={styles.input} placeholder="07XXXXXXXX"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>

          {/* Gender */}
          <Field label="Gender" col="2/3">
            <select style={styles.input} value={form.gender} onChange={e => set('gender', e.target.value)}>
              {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>

        <button style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }}
          onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
              <span style={styles.spinner} /> Submitting…
            </span>
          ) : 'Submit Registration'}
        </button>

        <p style={styles.footer}>
          Your data is only used for attendance tracking within Strathmore University.
        </p>
      </div>
    </div>
  )
}

function Field({ label, col, error, hint, children }) {
  return (
    <div style={{ gridColumn: col }}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <div style={styles.errText}>{error}</div>}
      {hint && !error && <div style={styles.hint}>{hint}</div>}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '32px 16px 64px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: '#111',
    border: '1px solid #222',
    borderRadius: 16,
    padding: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoMark: {
    flexShrink: 0,
  },
  brand: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#fff',
    letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: '0.75rem',
    color: '#555',
    marginTop: 1,
  },
  desc: {
    fontSize: '0.83rem',
    color: '#666',
    lineHeight: 1.7,
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#888',
    marginBottom: 6,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#fff',
    fontSize: '0.88rem',
    outline: 'none',
    appearance: 'none',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: '#b6f542',
    color: '#000',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
  errBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: '0.82rem',
    color: '#f87171',
    marginBottom: 16,
  },
  errText: {
    fontSize: '0.73rem',
    color: '#f87171',
    marginTop: 4,
  },
  hint: {
    fontSize: '0.73rem',
    color: '#444',
    marginTop: 4,
  },
  footer: {
    fontSize: '0.72rem',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 1.6,
  },
  iconWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSub: {
    fontSize: '0.85rem',
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.7,
    marginBottom: 20,
  },
  pill: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 99,
    padding: '8px 18px',
    fontSize: '0.82rem',
    color: '#b6f542',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid #00000033',
    borderTop: '2px solid #000',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
}