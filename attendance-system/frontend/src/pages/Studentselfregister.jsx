import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import api from '../api/client'
import { useToast, Toasts } from '../hooks/useToast'

const SCHOOLS = ['SCES','SBS','SIMS','SLS','SHC','SPH','SIBS','SENL']
const DEPTS   = { SCES:['CS','IT','EE','SE'], SBS:['BBA','MBA','ACC'], SIMS:['MIS','MTH','ACT'], SLS:['LLB','LLM'], SHC:['COM','DEV'], SPH:['PH'], SIBS:['BIB'], SENL:['ENV'] }
const EMPTY   = { full_name:'', student_id:'', school:'SCES', department:'CS', year:1, semester:1, email:'', phone:'', gender:'Male' }

// ── The public URL students will land on after scanning ──────
// Set VITE_PUBLIC_URL in your .env to your deployed frontend URL
// e.g. https://attendiq.vercel.app
// Falls back to current origin so localhost still works for testing
const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_URL || window.location.origin

function genID() { return String(Math.floor(100000 + Math.random() * 900000)) }

export default function Students() {
  const [students, setStudents]   = useState([])
  const [pending,  setPending]    = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search,   setSearch]     = useState('')
  const [fSchool,  setFSchool]    = useState('')
  const [tab,      setTab]        = useState('approved')
  const [loading,  setLoading]    = useState(true)
  const [modal,    setModal]      = useState(null)
  const [selected, setSelected]   = useState(null)
  const [form,     setForm]       = useState(EMPTY)
  const [saving,   setSaving]     = useState(false)
  const [qrModal,  setQrModal]    = useState(false)
  const [qrImg,    setQrImg]      = useState('')
  const [qrLink,   setQrLink]     = useState('')
  const [qrToken,  setQrToken]    = useState('')
  const [qrForm,   setQrForm]     = useState({ school:'SCES', department:'CS' })
  const [qrLoading,setQrLoading]  = useState(false)
  const { toasts, toast }         = useToast()

  useEffect(() => { load() }, [])

  useEffect(() => {
    let d = tab === 'approved' ? students : pending
    if (search)  d = d.filter(s => `${s.full_name} ${s.student_id} ${s.reg_number} ${s.email}`.toLowerCase().includes(search.toLowerCase()))
    if (fSchool) d = d.filter(s => s.school === fSchool)
    setFiltered(d)
  }, [students, pending, search, fSchool, tab])

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        api.get('/students/'),
        api.get('/students/pending'),
      ])
      setStudents(r1.data)
      setPending(r2.data)
    } catch { toast('Failed to load students','err') }
    finally { setLoading(false) }
  }

  function openAdd()   { setForm({ ...EMPTY, student_id: genID() }); setModal('add') }
  function openEdit(s) { setForm({ full_name:s.full_name, student_id:s.student_id||s.reg_number, school:s.school, department:s.department, year:s.year, semester:s.semester, email:s.email||'', phone:s.phone||'', gender:s.gender||'Male' }); setSelected(s); setModal('edit') }
  function openDel(s)  { setSelected(s); setModal('delete') }
  function closeModal(){ setModal(null); setSelected(null) }

  async function handleSave() {
    if (!form.full_name || !form.student_id) return toast('Name and ID required','err')
    setSaving(true)
    try {
      const payload = { ...form, reg_number: form.student_id }
      if (modal === 'add') { await api.post('/students/', payload); toast(`${form.full_name} added`) }
      else { await api.put(`/students/${selected._id}`, payload); toast('Student updated') }
      closeModal(); load()
    } catch(e) { toast(e.response?.data?.detail || 'Failed to save','err') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await api.delete(`/students/${selected._id}`); toast('Student removed'); closeModal(); load() }
    catch { toast('Failed to delete','err') }
    finally { setSaving(false) }
  }

  async function handleApprove(s) {
    try { await api.patch(`/students/${s._id}/approve`); toast(`${s.full_name} approved`); load() }
    catch { toast('Failed to approve','err') }
  }

  async function handleReject(s) {
    try { await api.delete(`/students/${s._id}/reject`); toast('Rejected & removed'); load() }
    catch { toast('Failed to reject','err') }
  }

  async function generateQR() {
    setQrLoading(true)
    setQrImg('')
    setQrLink('')
    setQrToken('')
    try {
      // Backend generates token and stores lecturer_id against it
      const r = await api.post('/students/generate-link', qrForm)
      const { token, school, department } = r.data

      // Build the full URL using the public-facing frontend base
      const url = `${PUBLIC_BASE}/student-register?token=${token}&school=${school}&department=${department}`

      setQrToken(token)
      setQrLink(url)

      // Encode the full public URL into the QR — phones can open this directly
      const img = await QRCode.toDataURL(url, {
        width:  320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark:'#000000', light:'#ffffff' },
      })
      setQrImg(img)
    } catch { toast('Failed to generate QR','err') }
    finally { setQrLoading(false) }
  }

  function downloadQR() {
    const a = document.createElement('a')
    a.href     = qrImg
    a.download = `register-qr-${qrForm.school}-${qrForm.department}.png`
    a.click()
  }

  function copyLink() {
    navigator.clipboard.writeText(qrLink)
    toast('Link copied!')
  }

  const F = ({ label, k, type='text', placeholder, options, half }) => (
    <div className="fg" style={{ gridColumn: half ? undefined : '1/-1' }}>
      <label className="fl">{label}</label>
      {options ? (
        <select className="fc" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
          {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
        </select>
      ) : (
        <input className="fc" type={type} placeholder={placeholder} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
      )}
    </div>
  )

  return (
    <div className="page-in">
      <div className="topbar">
        <div className="tb-title">Students</div>
        <div className="tb-meta">{students.length} enrolled · {pending.length} pending</div>
      </div>

      <div className="body">
        <div className="sh">
          <div>
            <div className="sh-title">Student Registry</div>
            <div className="sh-sub">All enrolled students across Strathmore schools</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={() => { setQrImg(''); setQrLink(''); setQrToken(''); setQrModal(true) }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h4M14 21h4v-4"/></svg>
              QR Register
            </button>
            <button className="btn btn-lime" onClick={openAdd}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 1v11M1 6.5h11"/></svg>
              Add Student
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
          {['approved','pending'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'7px 16px', fontSize:'0.8rem', fontWeight:600, border:'none', background:'none', cursor:'pointer',
                color: tab===t ? 'var(--lime,#b6f542)' : 'var(--muted)',
                borderBottom: tab===t ? '2px solid var(--lime,#b6f542)' : '2px solid transparent',
                textTransform:'capitalize', letterSpacing:'0.04em' }}>
              {t === 'approved' ? `Enrolled (${students.length})` : (
                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  Pending {pending.length > 0 && <span style={{ background:'var(--lime,#b6f542)', color:'#000', borderRadius:99, padding:'1px 7px', fontSize:'0.7rem' }}>{pending.length}</span>}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
            <svg className="search-ico" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5.5" cy="5.5" r="4"/><path d="M9 9L12 12"/></svg>
            <input className="fc" placeholder="Search name, ID, email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="fc" style={{ width:150 }} value={fSchool} onChange={e => setFSchool(e.target.value)}>
            <option value="">All Schools</option>
            {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ── Approved Tab ── */}
        {tab === 'approved' && (
          <div className="card card-flush">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>#</th><th>Student ID</th><th>Full Name</th><th>School</th><th>Dept</th><th>Year</th><th>Email</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? [1,2,3,4,5].map(i => (
                    <tr key={i}>{[1,2,3,4,5,6,7,8].map(j => <td key={j}><div className="sk" style={{ height:12, width:j===0?20:'75%' }} /></td>)}</tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan="8"><div className="empty"><div className="empty-text">No students found</div></div></td></tr>
                  ) : filtered.map((s,i) => (
                    <tr key={s._id||i}>
                      <td><span className="mono muted" style={{ fontSize:'0.68rem' }}>{i+1}</span></td>
                      <td>
                        <span style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', background:'var(--bg3)', padding:'3px 8px', borderRadius:6, border:'1px solid var(--border2)', letterSpacing:'0.06em' }}>
                          {s.student_id || s.reg_number}
                        </span>
                      </td>
                      <td style={{ fontWeight:600 }}>{s.full_name}</td>
                      <td><span className="badge b-lime">{s.school}</span></td>
                      <td><span className="muted sm">{s.department}</span></td>
                      <td><span className="mono muted sm">Y{s.year}</span></td>
                      <td><span className="muted sm trunc" style={{ maxWidth:160, display:'block' }}>{s.email}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => openDel(s)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pending Tab ── */}
        {tab === 'pending' && (
          <div className="card card-flush">
            {pending.length === 0 && !loading ? (
              <div className="empty" style={{ padding:48 }}>
                <div className="empty-text">No pending registrations</div>
                <div className="muted sm" style={{ marginTop:6 }}>Students who self-register via QR will appear here for approval</div>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>#</th><th>Student ID</th><th>Full Name</th><th>School</th><th>Dept</th><th>Year</th><th>Email</th><th>Actions</th></tr></thead>
                  <tbody>
                    {loading ? [1,2,3].map(i => (
                      <tr key={i}>{[1,2,3,4,5,6,7,8].map(j => <td key={j}><div className="sk" style={{ height:12, width:'75%' }} /></td>)}</tr>
                    )) : filtered.map((s,i) => (
                      <tr key={s._id||i} style={{ background:'rgba(182,245,66,0.03)' }}>
                        <td><span className="mono muted" style={{ fontSize:'0.68rem' }}>{i+1}</span></td>
                        <td>
                          <span style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', background:'var(--bg3)', padding:'3px 8px', borderRadius:6, border:'1px solid var(--border2)', letterSpacing:'0.06em' }}>
                            {s.student_id || s.reg_number}
                          </span>
                        </td>
                        <td style={{ fontWeight:600 }}>{s.full_name}</td>
                        <td><span className="badge b-lime">{s.school}</span></td>
                        <td><span className="muted sm">{s.department}</span></td>
                        <td><span className="mono muted sm">Y{s.year}</span></td>
                        <td><span className="muted sm trunc" style={{ maxWidth:160, display:'block' }}>{s.email}</span></td>
                        <td>
                          <div style={{ display:'flex', gap:5 }}>
                            <button className="btn btn-lime btn-sm" onClick={() => handleApprove(s)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(s)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── QR Modal ── */}
      {qrModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setQrModal(false)}>
          <div className="modal" style={{ maxWidth:480 }}>
            <div className="modal-h">
              <span className="modal-title">Generate Self-Register QR</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setQrModal(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 2l10 10M12 2L2 12"/></svg>
              </button>
            </div>
            <div className="modal-b">

              {/* Step 1 — pick school/dept and generate */}
              {!qrImg ? (
                <>
                  <p style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:16, lineHeight:1.7 }}>
                    Pick your school and department. Students scan the QR with any phone camera — no app needed. Their submission lands in the <strong style={{ color:'var(--white)' }}>Pending</strong> tab for your approval.
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                    <div className="fg">
                      <label className="fl">School</label>
                      <select className="fc" value={qrForm.school} onChange={e => setQrForm(f => ({ ...f, school:e.target.value, department:(DEPTS[e.target.value]||[])[0]||'' }))}>
                        {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="fg">
                      <label className="fl">Department</label>
                      <select className="fc" value={qrForm.department} onChange={e => setQrForm(f => ({ ...f, department:e.target.value }))}>
                        {(DEPTS[qrForm.school]||[]).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Public URL hint */}
                  <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 12px', marginBottom:16, fontSize:'0.76rem', color:'var(--muted)' }}>
                    <span style={{ color:'var(--white)', fontWeight:600 }}>QR links to: </span>
                    {PUBLIC_BASE}/student-register?token=…
                    {PUBLIC_BASE.includes('localhost') && (
                      <div style={{ marginTop:6, color:'#f59e0b' }}>
                        ⚠ You're on localhost — phones won't be able to open this link. Set <code style={{ background:'rgba(255,255,255,0.07)', padding:'1px 5px', borderRadius:4 }}>VITE_PUBLIC_URL</code> in your <code style={{ background:'rgba(255,255,255,0.07)', padding:'1px 5px', borderRadius:4 }}>.env</code> to your deployed URL.
                      </div>
                    )}
                  </div>

                  <button className="btn btn-lime" style={{ width:'100%' }} onClick={generateQR} disabled={qrLoading}>
                    {qrLoading ? 'Generating…' : 'Generate QR Code'}
                  </button>
                </>
              ) : (
                /* Step 2 — show the QR */
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                  <div style={{ background:'#fff', borderRadius:14, padding:18, display:'inline-block', boxShadow:'0 0 0 1px rgba(0,0,0,0.08)' }}>
                    <img src={qrImg} alt="Registration QR Code" style={{ width:240, height:240, display:'block' }} />
                  </div>

                  {/* School / dept badge */}
                  <div style={{ display:'flex', gap:8 }}>
                    <span className="badge b-lime">{qrForm.school}</span>
                    <span className="badge" style={{ background:'var(--bg3)', color:'var(--muted)', border:'1px solid var(--border2)' }}>{qrForm.department}</span>
                  </div>

                  {/* Full link */}
                  <div style={{ fontSize:'0.71rem', color:'var(--muted)', wordBreak:'break-all', textAlign:'center', maxWidth:400, background:'var(--bg3)', padding:'8px 12px', borderRadius:8, border:'1px solid var(--border2)', lineHeight:1.6 }}>
                    {qrLink}
                  </div>

                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={copyLink}>Copy Link</button>
                    <button className="btn btn-lime btn-sm" onClick={downloadQR}>Download PNG</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setQrImg(''); setQrLink(''); setQrToken('') }}>Regenerate</button>
                  </div>

                  <p style={{ fontSize:'0.74rem', color:'var(--muted)', textAlign:'center', margin:0, lineHeight:1.6 }}>
                    Show or print this QR in class. Each scan is tied to your account — submissions appear in the <strong style={{ color:'var(--white)' }}>Pending</strong> tab.
  	              </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-h">
              <span className="modal-title">{modal === 'add' ? 'Add New Student' : 'Edit Student'}</span>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 2l10 10M12 2L2 12"/></svg>
              </button>
            </div>
            <div className="modal-b">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
                <F label="Full Name" k="full_name" placeholder="e.g. Alice Wanjiku" />
                <div className="fg" style={{ gridColumn:'1/-1' }}>
                  <label className="fl">Student ID (6 digits)</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="fc" placeholder="123456" value={form.student_id} style={{ flex:1, fontFamily:'var(--mono)', letterSpacing:'0.1em' }}
                      onChange={e => setForm(f => ({ ...f, student_id: e.target.value.replace(/\D/,'').slice(0,6) }))} />
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setForm(f => ({ ...f, student_id: genID() }))}>
                      Generate
                    </button>
                  </div>
                </div>
                <F half label="School" k="school" options={SCHOOLS} />
                <F half label="Department" k="department" options={DEPTS[form.school]||[]} />
                <F half label="Year" k="year" options={[1,2,3,4,5].map(y=>({ v:y, l:`Year ${y}` }))} />
                <F half label="Semester" k="semester" options={[{v:1,l:'Semester 1'},{v:2,l:'Semester 2'}]} />
                <F label="Email" k="email" type="email" placeholder="reg@strathmore.edu" />
                <F half label="Phone" k="phone" placeholder="07XXXXXXXX" />
                <F half label="Gender" k="gender" options={['Male','Female','Other']} />
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-lime" onClick={handleSave} disabled={saving || !form.full_name || form.student_id.length !== 6}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {modal === 'delete' && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal-h"><span className="modal-title">Remove Student?</span></div>
            <div className="modal-b">
              <p style={{ fontSize:'0.85rem', color:'var(--muted)', lineHeight:1.7 }}>
                This will permanently remove <strong style={{ color:'var(--white)' }}>{selected?.full_name}</strong> (ID: {selected?.student_id || selected?.reg_number}) and all their attendance records.
              </p>
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Removing…' : 'Yes, Remove'}</button>
            </div>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}