import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

// ── Toast system ─────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = (type, title, msg) => {
    const id = Date.now()
    setToasts(t => [...t, { id, type, title, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }
  const remove = id => setToasts(t => t.filter(x => x.id !== id))
  return { toasts, push, remove }
}

// ── Password strength ─────────────────────────────────────────────────────────
function pwStrength(pw) {
  let s = 0
  if (pw.length >= 6)  s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}
const STR_COLOR = ['', '#b84c2a', '#c8760a', '#a7b840', '#4a7a55']
const STR_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']

const INSTITUTIONS = [
  'Strathmore University','University of Nairobi','Kenyatta University',
  'JKUAT','Moi University','Egerton University','KCA University',
  'Daystar University','Kabarak University','Mount Kenya University','Other',
]

const SECTIONS = [
  { id: 'profile',       icon: ProfileIcon,  label: 'Profile' },
  { id: 'security',      icon: LockIcon,     label: 'Security' },
  { id: 'notifications', icon: BellIcon,     label: 'Notifications' },
  { id: 'feedback',      icon: ChatIcon,     label: 'Feedback' },
  { id: 'danger',        icon: AlertIcon,    label: 'Danger Zone' },
]

export default function Settings() {
  const { user, login, logout } = useAuthStore()
  const navigate = useNavigate()
  const { toasts, push, remove } = useToasts()
  const [active, setActive] = useState('profile')

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    full_name:   user?.full_name  || '',
    email:       user?.email      || '',
    institution: user?.school     || 'Strathmore University',
    username:    user?.username   || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)

  // ── Security state ─────────────────────────────────────────────────────────
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwLoading, setPwLoading] = useState(false)
  const pwStr = pwStrength(pw.next)

  // ── Notifications state ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    email_verified_nudge: true,
    low_attendance_alert: true,
    weekly_digest:        true,
    feedback_confirm:     true,
    session_reminder:     false,
  })

  // ── Feedback state ─────────────────────────────────────────────────────────
  const [fb, setFb] = useState({ category: 'general', message: '', rating: 0 })
  const [fbLoading, setFbLoading] = useState(false)
  const [fbSent, setFbSent] = useState(false)

  // ── Danger state ───────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // ── Resend verification ────────────────────────────────────────────────────
  const [resendLoading, setResendLoading] = useState(false)

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // ── Handlers ───────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profile.full_name.trim()) return push('error', 'Validation', 'Full name is required.')
    setProfileLoading(true)
    try {
      await api.patch('/auth/profile', {
        full_name:   profile.full_name.trim(),
        email:       profile.email.trim(),
        school:      profile.institution,
      })
      // update zustand + localStorage
      const updated = { ...user, full_name: profile.full_name.trim(), email: profile.email.trim(), school: profile.institution }
      login(localStorage.getItem('aiq_token'), updated)
      push('success', 'Profile saved', 'Your details have been updated.')
    } catch (err) {
      push('error', 'Save failed', err.response?.data?.detail || 'Could not save profile.')
    } finally { setProfileLoading(false) }
  }

  const changePassword = async () => {
    if (!pw.current)           return push('error', 'Validation', 'Enter your current password.')
    if (pw.next.length < 6)    return push('error', 'Validation', 'New password must be at least 6 characters.')
    if (pw.next !== pw.confirm) return push('error', 'Validation', 'New passwords do not match.')
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', { current_password: pw.current, new_password: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      push('success', 'Password changed', 'You are now using your new password.')
    } catch (err) {
      push('error', 'Failed', err.response?.data?.detail || 'Incorrect current password.')
    } finally { setPwLoading(false) }
  }

  const resendVerification = async () => {
    setResendLoading(true)
    try {
      await api.post('/auth/resend-verification', { username: user?.username })
      push('success', 'Email sent', 'Check your inbox for the verification link.')
    } catch {
      push('error', 'Failed', 'Could not send verification email.')
    } finally { setResendLoading(false) }
  }

  const submitFeedback = async () => {
    if (!fb.message.trim()) return push('error', 'Validation', 'Please write a message.')
    setFbLoading(true)
    try {
      await api.post('/feedback/', { username: user?.username, category: fb.category, message: fb.message, rating: fb.rating || null })
      setFbSent(true)
      setFb({ category: 'general', message: '', rating: 0 })
      push('success', 'Feedback sent!', 'Thank you — we read every message.')
      setTimeout(() => setFbSent(false), 3000)
    } catch {
      push('error', 'Failed', 'Could not send feedback. Try again.')
    } finally { setFbLoading(false) }
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== user?.username) return push('error', 'Wrong username', 'Type your username exactly to confirm.')
    setDeleteLoading(true)
    try {
      await api.delete('/auth/account')
      logout()
      navigate('/login')
    } catch {
      push('error', 'Failed', 'Could not delete account. Contact support.')
    } finally { setDeleteLoading(false) }
  }

  const exportData = async () => {
    try {
      const res = await api.get('/auth/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = 'attendiq-data.json'; a.click()
      push('success', 'Export ready', 'Your data has been downloaded.')
    } catch {
      push('error', 'Export failed', 'Could not export data.')
    }
  }

  return (
    <div className="page-in" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{CSS}</style>

      {/* Toast rack */}
      <div style={TS.rack}>
        {toasts.map(t => <ToastItem key={t.id} t={t} onClose={() => remove(t.id)} />)}
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div style={TS.modalBackdrop}>
          <div style={TS.modal}>
            <div style={TS.modalIcon}><AlertIcon size={22} color="#b84c2a" /></div>
            <h3 style={TS.modalTitle}>Delete your account?</h3>
            <p style={TS.modalSub}>This permanently deletes all your classes, attendance records, and student data. There is no undo.</p>
            <label style={TS.label}>Type <strong>{user?.username}</strong> to confirm</label>
            <input className="s-input" value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={user?.username} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="s-btn-ghost" style={{ flex: 1 }} onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>Cancel</button>
              <button className="s-btn-danger" style={{ flex: 1 }} onClick={deleteAccount} disabled={deleteLoading}>
                {deleteLoading ? <Spin /> : null} Delete forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="topbar">
        <div className="tb-title">Settings</div>
        <div className="tb-meta">Manage your account and preferences</div>
      </div>

      <div className="body">
        <div style={TS.layout}>

          {/* ── Sidebar ── */}
          <aside style={TS.sidebar}>
            {/* Avatar card */}
            <div style={TS.avatarCard}>
              <div style={TS.avatar}>{initials}</div>
              <div style={TS.avatarName}>{user?.full_name || user?.username}</div>
              <div style={TS.avatarRole}>{user?.role || 'Lecturer'}</div>
              {!user?.email_verified && user?.email && (
                <div style={TS.unverifiedBadge}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8760a', display: 'inline-block' }} />
                  Email unverified
                </div>
              )}
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SECTIONS.map(s => {
                const Icon = s.icon
                const isActive = active === s.id
                return (
                  <button key={s.id}
                    className={`s-nav-btn${isActive ? ' active' : ''}${s.id === 'danger' ? ' danger' : ''}`}
                    onClick={() => setActive(s.id)}>
                    <Icon size={15} />
                    {s.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* ── Main content ── */}
          <main style={TS.main}>

            {/* ════ PROFILE ════ */}
            {active === 'profile' && (
              <Section title="Profile" sub="Update your personal information and institution details.">
                <div style={TS.grid2}>
                  <Field label="Full Name">
                    <input className="s-input" value={profile.full_name}
                      onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Dr. Jane Mwangi" />
                  </Field>
                  <Field label="Username">
                    <input className="s-input" value={profile.username} disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                    <Hint>Username cannot be changed. Contact support if needed.</Hint>
                  </Field>
                </div>
                <Field label={<>Email Address {!user?.email_verified && user?.email && <span style={{ color: '#c8760a', fontSize: '0.6rem', fontFamily: 'DM Mono', marginLeft: 6 }}>UNVERIFIED</span>}</>}>
                  <input className="s-input" type="email" value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@university.edu" />
                </Field>
                {!user?.email_verified && user?.email && (
                  <div style={TS.nudgeBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 18 }}>✉️</span>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e1a14' }}>Verify your email address</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b6050' }}>Unlock alerts, digests and password recovery.</div>
                      </div>
                    </div>
                    <button className="s-btn-amber" onClick={resendVerification} disabled={resendLoading}>
                      {resendLoading ? <Spin /> : null} Resend link
                    </button>
                  </div>
                )}
                <Field label="Institution">
                  <select className="s-input s-select" value={profile.institution}
                    onChange={e => setProfile(p => ({ ...p, institution: e.target.value }))}>
                    {INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </Field>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="s-btn-main" onClick={saveProfile} disabled={profileLoading}>
                    {profileLoading ? <><Spin /> Saving…</> : 'Save profile →'}
                  </button>
                </div>
              </Section>
            )}

            {/* ════ SECURITY ════ */}
            {active === 'security' && (
              <>
                <Section title="Change Password" sub="Use a strong password you don't use elsewhere.">
                  <Field label="Current Password">
                    <PwField value={pw.current} show={showPw.current}
                      onChange={v => setPw(p => ({ ...p, current: v }))}
                      toggle={() => setShowPw(p => ({ ...p, current: !p.current }))}
                      placeholder="Your current password" />
                  </Field>
                  <Field label="New Password">
                    <PwField value={pw.next} show={showPw.next}
                      onChange={v => setPw(p => ({ ...p, next: v }))}
                      toggle={() => setShowPw(p => ({ ...p, next: !p.next }))}
                      placeholder="Minimum 6 characters" />
                    {pw.next.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                          {[1,2,3,4].map(n => (
                            <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= pwStr ? STR_COLOR[pwStr] : 'rgba(30,26,20,0.12)', transition: 'background .2s' }} />
                          ))}
                        </div>
                        <div style={{ fontSize: '0.62rem', fontFamily: 'DM Mono', color: STR_COLOR[pwStr] || '#9e9080' }}>{STR_LABEL[pwStr]}</div>
                      </div>
                    )}
                  </Field>
                  <Field label="Confirm New Password">
                    <PwField value={pw.confirm} show={showPw.confirm}
                      onChange={v => setPw(p => ({ ...p, confirm: v }))}
                      toggle={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                      placeholder="Repeat new password" />
                    {pw.confirm && pw.next !== pw.confirm && (
                      <div style={{ fontSize: '0.68rem', color: '#b84c2a', fontFamily: 'DM Mono', marginTop: 4 }}>Passwords do not match</div>
                    )}
                  </Field>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="s-btn-main" onClick={changePassword} disabled={pwLoading}>
                      {pwLoading ? <><Spin /> Updating…</> : 'Update password →'}
                    </button>
                  </div>
                </Section>

                <Section title="Session Info" sub="Details about your current login session.">
                  <div style={TS.infoGrid}>
                    {[
                      { label: 'Username',   val: user?.username },
                      { label: 'Role',       val: user?.role || 'Lecturer' },
                      { label: 'Institution',val: user?.school || '—' },
                      { label: 'Email',      val: user?.email || '—' },
                      { label: 'Last login', val: user?.last_login ? new Date(user.last_login).toLocaleString() : 'This session' },
                      { label: 'Email status', val: user?.email_verified ? '✓ Verified' : '✗ Unverified',
                        color: user?.email_verified ? '#4a7a55' : '#c8760a' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={TS.infoRow}>
                        <span style={TS.infoLabel}>{label}</span>
                        <span style={{ ...TS.infoVal, ...(color ? { color } : {}) }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className="s-btn-ghost" onClick={() => { logout(); navigate('/login') }}>
                      Sign out of all sessions
                    </button>
                  </div>
                </Section>

                <Section title="Forgot Password?" sub="Send a password reset link to your registered email.">
                  <p style={{ fontSize: '0.82rem', color: '#6b6050', lineHeight: 1.7, marginBottom: 14 }}>
                    If you're locked out or want to reset via email, we'll send a link to <strong>{user?.email || 'your registered email'}</strong>.
                  </p>
                  <button className="s-btn-ghost" onClick={async () => {
                    if (!user?.email) return push('error', 'No email', 'Add an email address in Profile first.')
                    try {
                      await api.post('/auth/forgot-password', { email: user.email })
                      push('success', 'Reset email sent', 'Check your inbox.')
                    } catch { push('error', 'Failed', 'Could not send reset email.') }
                  }}>
                    Send reset email →
                  </button>
                </Section>
              </>
            )}

            {/* ════ NOTIFICATIONS ════ */}
            {active === 'notifications' && (
              <Section title="Email Notifications" sub="Control which emails AttendIQ sends to you.">
                {[
                  { key: 'email_verified_nudge', label: 'Verification reminder',   sub: 'Remind me to verify my email address' },
                  { key: 'low_attendance_alert', label: 'Low attendance alerts',   sub: 'Alert me when a student drops below 75%' },
                  { key: 'weekly_digest',         label: 'Weekly digest',           sub: 'Summary of sessions and attendance every Monday' },
                  { key: 'feedback_confirm',      label: 'Feedback confirmation',  sub: 'Confirm when my feedback is received' },
                  { key: 'session_reminder',      label: 'Session reminders',      sub: 'Remind me 15 min before a scheduled class' },
                ].map(({ key, label, sub }) => (
                  <div key={key} style={TS.toggleRow}>
                    <div>
                      <div style={TS.toggleLabel}>{label}</div>
                      <div style={TS.toggleSub}>{sub}</div>
                    </div>
                    <Toggle on={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                  </div>
                ))}
                <div style={TS.notifNote}>
                  <span style={{ opacity: 0.5, fontSize: 14 }}>ℹ️</span>
                  Notification preferences are saved locally. Full server-side persistence coming soon.
                </div>

                <Divider />

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e1a14', marginBottom: 4 }}>Test your email connection</div>
                  <div style={{ fontSize: '0.72rem', color: '#9e9080', fontFamily: 'DM Mono', marginBottom: 12 }}>Send a test email to {user?.email || 'your registered address'}</div>
                  <button className="s-btn-ghost" onClick={async () => {
                    if (!user?.email) return push('error', 'No email', 'Add an email in Profile first.')
                    try {
                      await api.post('/auth/resend-verification', { username: user?.username })
                      push('success', 'Test sent!', `Check ${user.email}`)
                    } catch { push('error', 'Failed', 'Could not send test email.') }
                  }}>Send test email →</button>
                </div>
              </Section>
            )}

            {/* ════ FEEDBACK ════ */}
            {active === 'feedback' && (
              <Section title="Send Feedback" sub="Bug reports, feature ideas, or just a kind word — we read everything.">
                {fbSent ? (
                  <div style={TS.fbSuccess}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🙌</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e1a14' }}>Thank you!</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b6050', marginTop: 4 }}>Your feedback has been sent and will be reviewed soon.</div>
                  </div>
                ) : (
                  <>
                    <Field label="Category">
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { v: 'bug',     label: '🐛 Bug report' },
                          { v: 'feature', label: '💡 Feature idea' },
                          { v: 'praise',  label: '🌟 Praise' },
                          { v: 'general', label: '💬 General' },
                        ].map(({ v, label }) => (
                          <button key={v}
                            className={`s-chip${fb.category === v ? ' on' : ''}`}
                            onClick={() => setFb(p => ({ ...p, category: v }))}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="How would you rate your experience?">
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n}
                            onClick={() => setFb(p => ({ ...p, rating: n }))}
                            style={{
                              width: 38, height: 38, borderRadius: 8, border: '1px solid',
                              borderColor: fb.rating >= n ? '#c8760a' : 'rgba(30,26,20,0.18)',
                              background: fb.rating >= n ? 'rgba(200,118,10,0.1)' : 'transparent',
                              fontSize: 18, cursor: 'pointer', transition: 'all .15s',
                            }}>
                            {fb.rating >= n ? '★' : '☆'}
                          </button>
                        ))}
                        {fb.rating > 0 && (
                          <span style={{ fontSize: '0.72rem', fontFamily: 'DM Mono', color: '#9e9080', alignSelf: 'center', marginLeft: 4 }}>
                            {['','Poor','Fair','Good','Great','Excellent'][fb.rating]}
                          </span>
                        )}
                      </div>
                    </Field>

                    <Field label="Message">
                      <textarea className="s-input s-textarea"
                        placeholder="Describe your experience, report a bug, or suggest a feature…"
                        value={fb.message}
                        onChange={e => setFb(p => ({ ...p, message: e.target.value }))}
                        rows={5} />
                      <div style={{ textAlign: 'right', fontSize: '0.62rem', fontFamily: 'DM Mono', color: '#b0a090', marginTop: 4 }}>
                        {fb.message.length} / 2000
                      </div>
                    </Field>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="s-btn-main" onClick={submitFeedback} disabled={fbLoading}>
                        {fbLoading ? <><Spin /> Sending…</> : 'Send feedback →'}
                      </button>
                    </div>
                  </>
                )}
              </Section>
            )}

            {/* ════ DANGER ZONE ════ */}
            {active === 'danger' && (
              <>
                <Section title="Export My Data" sub="Download a copy of all your AttendIQ data as JSON.">
                  <p style={{ fontSize: '0.82rem', color: '#6b6050', lineHeight: 1.7, marginBottom: 14 }}>
                    Includes your profile, all classes, student lists, and full attendance records.
                  </p>
                  <button className="s-btn-ghost" onClick={exportData}>
                    Download my data →
                  </button>
                </Section>

                <div style={TS.dangerCard}>
                  <div style={TS.dangerHeader}>
                    <AlertIcon size={16} color="#b84c2a" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b84c2a', fontFamily: 'DM Mono', letterSpacing: '0.08em' }}>DANGER ZONE</span>
                  </div>

                  <div style={TS.dangerRow}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e1a14', marginBottom: 3 }}>Delete Account</div>
                      <div style={{ fontSize: '0.75rem', color: '#9e9080', lineHeight: 1.6 }}>
                        Permanently deletes your account, all classes, students, and attendance records. Cannot be undone.
                      </div>
                    </div>
                    <button className="s-btn-danger-outline" onClick={() => setShowDeleteModal(true)}>
                      Delete account
                    </button>
                  </div>
                </div>
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, sub, children }) {
  return (
    <div style={TS.section}>
      <div style={TS.sectionHead}>
        <div style={TS.sectionTitle}>{title}</div>
        {sub && <div style={TS.sectionSub}>{sub}</div>}
      </div>
      <div style={TS.sectionBody}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={TS.label}>{label}</label>
      {children}
    </div>
  )
}

function Hint({ children }) {
  return <div style={{ fontSize: '0.62rem', fontFamily: 'DM Mono', color: '#9e9080', marginTop: 4 }}>{children}</div>
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(30,26,20,0.1)', margin: '20px 0' }} />
}

function PwField({ value, show, onChange, toggle, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <input className="s-input" type={show ? 'text' : 'password'}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button type="button" onClick={toggle} style={TS.eyeBtn}>
        {show
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><line x1="2" y1="2" x2="14" y2="14"/></svg>
          : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
        }
      </button>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, flexShrink: 0, cursor: 'pointer' }}>
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 12, transition: '.2s',
        background: on ? '#c8760a' : 'rgba(30,26,20,0.18)',
      }}>
        <span style={{
          position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff',
          top: 3, left: on ? 21 : 3, transition: '.2s',
        }} />
      </span>
    </label>
  )
}

function ToastItem({ t, onClose }) {
  const C = { success: '#4a7a55', error: '#b84c2a', info: '#c8760a' }
  const I = { success: '✓', error: '✕', info: '!' }
  return (
    <div style={{ ...TS.toast, borderLeft: `3px solid ${C[t.type]}`, animation: 'toastIn .3s both' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: C[t.type] + '18', color: C[t.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{I[t.type]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#1e1a14', marginBottom: 1 }}>{t.title}</div>
        <div style={{ fontSize: '0.72rem', color: '#6b6050' }}>{t.msg}</div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9e9080', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  )
}

function Spin() {
  return <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite', marginRight: 6, verticalAlign: 'middle' }} />
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ProfileIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
}
function LockIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>
}
function BellIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 2a5 5 0 0 1 5 5v3l1 1H2l1-1V7a5 5 0 0 1 5-5z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></svg>
}
function ChatIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 9a2 2 0 0 1-2 2H5l-3 3V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/></svg>
}
function AlertIcon({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6"><path d="M8 2L14.9 14H1.1L8 2z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r=".5" fill={color}/></svg>
}

// ── Styles ────────────────────────────────────────────────────────────────────
const TS = {
  layout:       { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' },
  sidebar:      { position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  avatarCard:   { background: '#1e1a14', borderRadius: 14, padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' },
  avatar:       { width: 52, height: 52, borderRadius: 14, background: '#c8760a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 700, fontSize: '1rem', color: '#fff', margin: '0 auto 10px' },
  avatarName:   { fontWeight: 600, fontSize: '0.82rem', color: '#fff', letterSpacing: '-0.02em', marginBottom: 3 },
  avatarRole:   { fontSize: '0.62rem', fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  unverifiedBadge: { marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(200,118,10,0.15)', border: '1px solid rgba(200,118,10,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: '0.6rem', fontFamily: 'DM Mono', color: '#c8760a' },
  main:         { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  section:      { background: '#faf7f2', border: '1px solid rgba(30,26,20,0.1)', borderRadius: 14, overflow: 'hidden' },
  sectionHead:  { padding: '18px 22px', borderBottom: '1px solid rgba(30,26,20,0.08)' },
  sectionTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1e1a14', letterSpacing: '-0.02em', marginBottom: 3 },
  sectionSub:   { fontSize: '0.72rem', fontFamily: 'DM Mono', color: '#9e9080' },
  sectionBody:  { padding: '20px 22px' },
  label:        { display: 'block', fontSize: '0.58rem', fontFamily: 'DM Mono', color: '#9e9080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 },
  grid2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  eyeBtn:       { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9e9080', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 },
  toggleRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid rgba(30,26,20,0.07)' },
  toggleLabel:  { fontSize: '0.84rem', fontWeight: 600, color: '#1e1a14', marginBottom: 2 },
  toggleSub:    { fontSize: '0.7rem', fontFamily: 'DM Mono', color: '#9e9080' },
  notifNote:    { display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', background: 'rgba(200,118,10,0.06)', border: '1px solid rgba(200,118,10,0.15)', borderRadius: 8, fontSize: '0.68rem', fontFamily: 'DM Mono', color: '#9e9080' },
  nudgeBanner:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: 'rgba(200,118,10,0.07)', border: '1px solid rgba(200,118,10,0.2)', borderRadius: 10, marginBottom: 16 },
  infoGrid:     { display: 'flex', flexDirection: 'column', gap: 0 },
  infoRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(30,26,20,0.07)' },
  infoLabel:    { fontSize: '0.72rem', fontFamily: 'DM Mono', color: '#9e9080' },
  infoVal:      { fontSize: '0.8rem', fontWeight: 600, color: '#1e1a14', fontFamily: 'DM Mono' },
  fbSuccess:    { textAlign: 'center', padding: '32px 0' },
  dangerCard:   { border: '1px solid rgba(184,76,42,0.25)', borderRadius: 14, overflow: 'hidden' },
  dangerHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: 'rgba(184,76,42,0.05)', borderBottom: '1px solid rgba(184,76,42,0.15)' },
  dangerRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 20px' },
  rack:         { position: 'fixed', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 999, pointerEvents: 'none' },
  toast:        { background: '#faf7f2', border: '1px solid rgba(30,26,20,0.15)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 240, maxWidth: 300, pointerEvents: 'all', boxShadow: '0 4px 20px rgba(30,26,20,0.1)' },
  modalBackdrop:{ position: 'fixed', inset: 0, background: 'rgba(30,26,20,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#faf7f2', borderRadius: 16, padding: 28, width: 380, maxWidth: '90vw' },
  modalIcon:    { width: 44, height: 44, borderRadius: 12, background: 'rgba(184,76,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle:   { fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: '#1e1a14', marginBottom: 8, marginTop: 0 },
  modalSub:     { fontSize: '0.8rem', color: '#6b6050', lineHeight: 1.7, marginBottom: 18 },
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
.s-input{width:100%;padding:9px 12px;background:#ede8de;border:1px solid rgba(30,26,20,0.18);border-radius:8px;color:#1e1a14;font-family:'DM Sans',sans-serif;font-size:0.875rem;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;}
.s-input:focus{border-color:#c8760a;box-shadow:0 0 0 3px rgba(200,118,10,0.12);}
.s-input:disabled{opacity:0.5;cursor:not-allowed;}
.s-input::placeholder{color:#c4b8a8;}
.s-select{cursor:pointer;} .s-select option{background:#ede8de;color:#1e1a14;}
.s-textarea{resize:vertical;min-height:100px;line-height:1.6;}
.s-btn-main{padding:10px 20px;background:#c8760a;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;}
.s-btn-main:hover:not(:disabled){background:#a85f06;transform:translateY(-1px);}
.s-btn-main:disabled{opacity:0.65;cursor:not-allowed;}
.s-btn-ghost{padding:9px 18px;background:transparent;color:#6b6050;border:1px solid rgba(30,26,20,0.2);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:500;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;}
.s-btn-ghost:hover{border-color:rgba(30,26,20,0.4);color:#1e1a14;}
.s-btn-amber{padding:7px 14px;background:rgba(200,118,10,0.1);color:#c8760a;border:1px solid rgba(200,118,10,0.3);border-radius:7px;font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;display:inline-flex;align-items:center;gap:5px;}
.s-btn-amber:hover:not(:disabled){background:rgba(200,118,10,0.18);}
.s-btn-amber:disabled{opacity:0.6;cursor:not-allowed;}
.s-btn-danger{padding:10px 20px;background:#b84c2a;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;}
.s-btn-danger:hover:not(:disabled){background:#962f12;}
.s-btn-danger:disabled{opacity:0.6;cursor:not-allowed;}
.s-btn-danger-outline{padding:8px 16px;background:transparent;color:#b84c2a;border:1px solid rgba(184,76,42,0.35);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;}
.s-btn-danger-outline:hover{background:rgba(184,76,42,0.07);border-color:rgba(184,76,42,0.6);}
.s-nav-btn{width:100%;padding:9px 12px;background:transparent;border:none;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:500;color:#6b6050;display:flex;align-items:center;gap:9px;transition:all .15s;text-align:left;}
.s-nav-btn:hover{background:rgba(30,26,20,0.05);color:#1e1a14;}
.s-nav-btn.active{background:#1e1a14;color:#fff;}
.s-nav-btn.danger{color:#b84c2a;}
.s-nav-btn.danger:hover{background:rgba(184,76,42,0.08);}
.s-chip{padding:6px 14px;border-radius:20px;border:1px solid rgba(30,26,20,0.18);background:transparent;font-family:'DM Mono',monospace;font-size:0.72rem;color:#6b6050;cursor:pointer;transition:all .15s;}
.s-chip:hover{border-color:rgba(30,26,20,0.35);color:#1e1a14;}
.s-chip.on{background:rgba(200,118,10,0.1);color:#c8760a;border-color:rgba(200,118,10,0.4);}
@keyframes toastIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
`