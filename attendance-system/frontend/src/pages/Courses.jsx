import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast, Toasts } from '../hooks/useToast'

const SCHOOLS = ['Strathmore University','University of Nairobi','Kenyatta University','JKUAT','Moi University','Egerton University','KCA University','Daystar University','Kabarak University','Mount Kenya University','Other']
const EMPTY   = { lesson_name:'', unit_code:'', school:'Strathmore University', department:'', description:'', schedule:'', venue:'', credit_hours:'3' }

const SCHOOL_DOT = {
  'Strathmore University':'#f0c060',
  'University of Nairobi':'#5cb87a',
  'KCA University':'#60a5fa',
  'JKUAT':'#e06060',
  'Kenyatta University':'#a78bfa',
  'Moi University':'#fb923c',
}
const dot = s => SCHOOL_DOT[s] || '#f0c060'

export default function Courses() {
  const navigate = useNavigate()
  const [courses,  setCourses]  = useState([])
  const [filtered, setFiltered] = useState([])
  const [search,   setSearch]   = useState('')
  const [fSchool,  setFSchool]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   // null | 'add' | 'edit' | 'delete' | 'view'
  const [sel,      setSel]      = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const { toasts, toast } = useToast()

  useEffect(() => { load() }, [])
  useEffect(() => {
    let d = courses
    if (search)  d = d.filter(c => `${c.lesson_name||''} ${c.unit_name||''} ${c.unit_code||''} ${c.school||''} ${c.department||''} ${c.description||''}`.toLowerCase().includes(search.toLowerCase()))
    if (fSchool) d = d.filter(c => c.school === fSchool)
    setFiltered(d)
  }, [courses, search, fSchool])

  async function load() {
    setLoading(true)
    try { const r = await api.get('/classes/'); setCourses(r.data) }
    catch { toast('Failed to load courses','err') }
    finally { setLoading(false) }
  }

  function openAdd()  { setForm(EMPTY); setModal('add') }
  function openEdit(c){ setSel(c); setForm({ lesson_name:c.lesson_name||c.unit_name||'', unit_code:c.unit_code||'', school:c.school||'Strathmore University', department:c.department||'', description:c.description||'', schedule:c.schedule||'', venue:c.venue||'', credit_hours:String(c.credit_hours||3) }); setModal('edit') }
  function openView(c){ setSel(c); setModal('view') }
  function openDel(c) { setSel(c); setModal('delete') }
  function close()    { setModal(null); setSel(null) }

  async function save() {
    if (!form.lesson_name.trim()) return toast('Course name is required','err')
    if (!form.unit_code.trim())   return toast('Unit code is required','err')
    setSaving(true)
    try {
      if (modal === 'add') { await api.post('/classes/', form);              toast(`${form.lesson_name} added`) }
      else                 { await api.patch(`/classes/${sel._id}`, form);  toast('Course updated') }
      close(); load()
    } catch(e) { toast(e.response?.data?.detail || 'Failed to save','err') }
    finally { setSaving(false) }
  }

  async function del() {
    setSaving(true)
    try { await api.delete(`/classes/${sel._id}`); toast('Course deleted'); close(); load() }
    catch { toast('Failed to delete','err') }
    finally { setSaving(false) }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const Field = ({ label, k, placeholder, type='text', half, hint }) => (
    <div className="fg" style={{ gridColumn: half ? undefined : '1/-1' }}>
      <label className="fl">{label}</label>
      <input className="fc" type={type} placeholder={placeholder} value={form[k]} onChange={f(k)} />
      {hint && <div style={{ fontSize:'.62rem', color:'var(--tx3)', fontFamily:'var(--mono)', marginTop:4 }}>{hint}</div>}
    </div>
  )

  const grouped = filtered.reduce((a,c) => { const k=c.school||'Other';(a[k]=a[k]||[]).push(c);return a },{})

  return (
    <div className="page-in">
      <div className="topbar">
        <div className="tb-title">Courses</div>
        <div className="tb-meta">{filtered.length} courses</div>
      </div>

      <div className="body">
        <div className="sh">
          <div>
            <div className="sh-title">Course Registry</div>
            <div className="sh-sub">Manage all units across institutions</div>
          </div>
          <button className="btn btn-gold" onClick={openAdd}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 1v11M1 6.5h11"/></svg>
            Add Course
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          <div className="search-wrap" style={{ flex:1 }}>
            <svg className="search-ico" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5.5" cy="5.5" r="4"/><path d="M9 9L12 12"/></svg>
            <input className="fc" placeholder="Search by name, code, school…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="fc" style={{ width:200 }} value={fSchool} onChange={e => setFSchool(e.target.value)}>
            <option value="">All Institutions</option>
            {SCHOOLS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card" style={{ padding:'24px' }}>
            {[1,2,3].map(i => <div key={i} className="sk" style={{ height:48, marginBottom:10, borderRadius:10 }} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="card">
            <div className="empty">
              <div style={{ fontSize:'2rem', marginBottom:10 }}>📚</div>
              <div className="empty-text" style={{ marginBottom:14 }}>{search || fSchool ? 'No courses match your filters' : 'No courses yet — add your first one'}</div>
              {!search && !fSchool && <button className="btn btn-gold" onClick={openAdd}>Add Course</button>}
            </div>
          </div>
        )}

        {/* Grouped by institution */}
        {!loading && Object.entries(grouped).map(([school, list]) => (
          <div key={school} className="card card-flush" style={{ marginBottom:14 }}>
            {/* Institution header */}
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--br)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background: dot(school), boxShadow:`0 0 8px ${dot(school)}66` }} />
                <span style={{ fontWeight:700, fontSize:'.88rem' }}>{school}</span>
              </div>
              <span style={{ fontSize:'.64rem', fontFamily:'var(--mono)', color:'var(--tx3)' }}>{list.length} course{list.length!==1?'s':''}</span>
            </div>

            {/* Course rows */}
            {list.map((c, i) => (
              <div key={c._id||i}
                style={{ padding:'13px 18px', display:'flex', alignItems:'center', gap:14, borderBottom: i<list.length-1?'1px solid var(--br)':'none', transition:'background 120ms', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                onClick={() => openView(c)}
              >
                {/* Code badge */}
                <div style={{ width:48, height:48, flexShrink:0, borderRadius:11, background:`${dot(school)}15`, border:`1px solid ${dot(school)}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:'.56rem', fontWeight:700, color:dot(school), letterSpacing:'-.01em', textAlign:'center', padding:4 }}>
                  {(c.unit_code||'').slice(0,6)}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.875rem', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.lesson_name || c.unit_name}</div>
                  <div style={{ fontSize:'.68rem', fontFamily:'var(--mono)', color:'var(--tx3)', display:'flex', gap:14, flexWrap:'wrap' }}>
                    {c.department && <span>{c.department}</span>}
                    {c.schedule   && <span>🕐 {c.schedule}</span>}
                    {c.venue      && <span>📍 {c.venue}</span>}
                  </div>
                  {/* Description preview */}
                  {c.description && (
                    <div style={{ fontSize:'.7rem', color:'var(--tx3)', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:520 }}>
                      {c.description}
                    </div>
                  )}
                </div>

                <span className="badge b-muted" style={{ flexShrink:0 }}>{c.credit_hours||'—'} cr</span>

                {/* Actions */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/attendance')}>Mark</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => openDel(c)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-h">
              <span className="modal-title">{modal === 'add' ? 'Add New Course' : `Edit — ${sel?.unit_code}`}</span>
              <button className="btn btn-ghost btn-icon" onClick={close}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 2l10 10M12 2L2 12"/></svg>
              </button>
            </div>
            <div className="modal-b">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
                <Field label="Course Name" k="lesson_name" placeholder="e.g. Data Structures & Algorithms" />
                <div className="fg" style={{ gridColumn:'1/-1' }}>
                  <label className="fl">Description</label>
                  <textarea
                    className="fc"
                    placeholder="Brief overview of what this course covers, its objectives, and key topics…"
                    value={form.description}
                    onChange={f('description')}
                    rows={3}
                    style={{ resize:'vertical', lineHeight:1.6 }}
                  />
                </div>
                <Field half label="Unit Code"     k="unit_code"    placeholder="e.g. ICS3101" />
                <Field half label="Credit Hours"  k="credit_hours" placeholder="3" />
                <div className="fg" style={{ gridColumn:'1/-1' }}>
                  <label className="fl">Institution</label>
                  <select className="fc" value={form.school} onChange={f('school')}>
                    {SCHOOLS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <Field half label="Department"    k="department"   placeholder="e.g. ICS, BBA, LLB" />
                <Field half label="Schedule"      k="schedule"     placeholder="Mon/Wed 8:00–10:00AM" />
                <Field label="Venue / Room"        k="venue"        placeholder="e.g. Lab 2, Koitalel Block" />
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={close}>Cancel</button>
              <button className="btn btn-gold" onClick={save} disabled={saving || !form.lesson_name.trim() || !form.unit_code.trim()}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {modal === 'view' && sel && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal" style={{ maxWidth:480 }}>
            <div className="modal-h">
              <div>
                <div className="modal-title">{sel.lesson_name || sel.unit_name}</div>
                <div style={{ fontSize:'.68rem', fontFamily:'var(--mono)', color:'var(--tx3)', marginTop:3 }}>{sel.unit_code} · {sel.school}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={close}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 2l10 10M12 2L2 12"/></svg>
              </button>
            </div>
            <div className="modal-b">
              {/* Description */}
              {sel.description ? (
                <div style={{ background:'var(--bg3)', border:'1px solid var(--br2)', borderRadius:'var(--r)', padding:'14px', marginBottom:18 }}>
                  <div style={{ fontSize:'.6rem', fontFamily:'var(--mono)', color:'var(--tx3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:7 }}>About this course</div>
                  <p style={{ fontSize:'.84rem', color:'var(--tx2)', lineHeight:1.75 }}>{sel.description}</p>
                </div>
              ) : (
                <div style={{ background:'var(--bg3)', border:'1px dashed var(--br2)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:18, fontSize:'.78rem', color:'var(--tx3)' }}>
                  No description added yet.
                </div>
              )}

              {/* Details grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  ['Institution', sel.school],
                  ['Department',  sel.department || '—'],
                  ['Schedule',    sel.schedule   || '—'],
                  ['Venue',       sel.venue      || '—'],
                  ['Credit Hours',sel.credit_hours ? `${sel.credit_hours} credits` : '—'],
                  ['Unit Code',   sel.unit_code  || '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ background:'var(--bg3)', borderRadius:'var(--r)', padding:'11px 14px' }}>
                    <div style={{ fontSize:'.58rem', fontFamily:'var(--mono)', color:'var(--tx3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:'.84rem', fontWeight:600 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={close}>Close</button>
              <button className="btn btn-ghost" onClick={() => { close(); openEdit(sel) }}>Edit</button>
              <button className="btn btn-gold" onClick={() => { close(); navigate('/dashboard/attendance') }}>Mark Attendance →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {modal === 'delete' && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal-h"><span className="modal-title">Delete Course?</span></div>
            <div className="modal-b">
              <p style={{ fontSize:'.84rem', color:'var(--tx3)', lineHeight:1.75 }}>
                Delete <strong style={{ color:'var(--tx)' }}>{sel?.lesson_name || sel?.unit_name}</strong> ({sel?.unit_code})?
                All attendance records linked to this course may be affected.
              </p>
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={del} disabled={saving}>{saving?'Deleting…':'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}