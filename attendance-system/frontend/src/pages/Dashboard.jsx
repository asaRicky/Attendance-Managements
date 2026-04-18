import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'

// ─── tiny toast hook (self-contained, no external dep) ───────
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return { toasts, add }
}

// ─── helpers ─────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0]
const todayLabel = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})
const STATUS_COLOR = { present: '#16a34a', absent: '#ef4444', late: '#f59e0b' }
const STATUS_BG    = { present: '#f0fdf4', absent: '#fef2f2', late: '#fffbeb' }

// school-color palette (cycles)
const SCHOOL_COLORS = ['#c8f04c','#4cf0b8','#f0c84c','#c84cf0','#4c8cf0','#f04c8c']

// ─── Modal ───────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:1000,
      background:'rgba(10,10,15,.6)',backdropFilter:'blur(6px)',
      display:'flex',alignItems:'center',justifyContent:'center',
      animation:'fadeIn .18s ease',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'#fff',borderRadius:20,
        width:'100%',maxWidth:width,margin:'0 16px',
        boxShadow:'0 32px 80px rgba(0,0,0,.22)',overflow:'hidden',
        animation:'slideUp .22s ease',
      }}>
        <div style={{
          padding:'20px 24px 16px',borderBottom:'1px solid #f0f0f0',
          display:'flex',alignItems:'center',justifyContent:'space-between',
        }}>
          <span style={{ fontWeight:700,fontSize:'1rem',letterSpacing:'-0.02em' }}>{title}</span>
          <button onClick={onClose} style={{
            background:'#f5f5f5',border:'none',cursor:'pointer',
            width:28,height:28,borderRadius:8,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:'#888',fontSize:'0.9rem',transition:'background .15s',
          }} onMouseEnter={e=>e.currentTarget.style.background='#e8e8e8'}
             onMouseLeave={e=>e.currentTarget.style.background='#f5f5f5'}>✕</button>
        </div>
        <div style={{ padding:'20px 24px 24px',maxHeight:'80vh',overflowY:'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── ClassForm ───────────────────────────────────────────────
function ClassForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    lesson_name:  initial?.lesson_name  || '',
    unit_code:    initial?.unit_code    || '',
    school:       initial?.school       || '',
    department:   initial?.department   || '',
    schedule:     initial?.schedule     || '',
    venue:        initial?.venue        || '',
    credit_hours: initial?.credit_hours || '',
  })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const isEdit = !!initial

  const Field = ({ label, k, placeholder, hint, half, disabled: dis }) => (
    <div style={{ marginBottom:14, gridColumn: half ? undefined : '1/-1' }}>
      <label style={{ display:'block',fontSize:'0.7rem',fontWeight:600,
        color:'#888',marginBottom:5,letterSpacing:'0.08em',textTransform:'uppercase' }}>
        {label}
      </label>
      <input
        style={{
          width:'100%',padding:'10px 13px',border:'1.5px solid #e8e8e8',
          borderRadius:10,fontSize:'0.875rem',outline:'none',
          background: dis ? '#fafafa' : '#fff',color:'#0a0a0f',
          transition:'border-color .15s',fontFamily:'inherit',
        }}
        onFocus={e => !dis && (e.target.style.borderColor='#0a0a0f')}
        onBlur={e => e.target.style.borderColor='#e8e8e8'}
        value={form[k]} onChange={set(k)} placeholder={placeholder} disabled={dis}
      />
      {hint && <div style={{ fontSize:'0.68rem',color:'#aaa',marginTop:4 }}>{hint}</div>}
    </div>
  )

  return (
    <form onSubmit={e=>{ e.preventDefault(); onSubmit(form) }}
      style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px' }}>
      <Field label="Lesson Name"   k="lesson_name"  placeholder="Data Structures & Algorithms" />
      <Field label="Unit Code"     k="unit_code"    placeholder="ICS3101" half
        hint={isEdit ? 'Cannot be changed' : ''} dis={isEdit} />
      <Field label="Credit Hours"  k="credit_hours" placeholder="3" half />
      <Field label="School / University" k="school"  placeholder="Strathmore University" />
      <Field label="Department"    k="department"   placeholder="ICS, BBA…" half />
      <Field label="Schedule"      k="schedule"     placeholder="Mon/Wed 8:00AM–10:00AM" half />
      <Field label="Venue / Room"  k="venue"        placeholder="Lab 2, Block A" />
      <div style={{ gridColumn:'1/-1',display:'flex',gap:10,justifyContent:'flex-end',marginTop:8 }}>
        <button type="button" onClick={onCancel}
          style={{ padding:'9px 20px',border:'1.5px solid #e8e8e8',borderRadius:10,
            background:'#fff',cursor:'pointer',fontSize:'0.85rem',fontFamily:'inherit' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding:'9px 22px',background:'#0a0a0f',color:'#fff',border:'none',
            borderRadius:10,cursor:'pointer',fontSize:'0.85rem',fontWeight:600,
            opacity:saving?.5:1,fontFamily:'inherit' }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Class'}
        </button>
      </div>
    </form>
  )
}

// ─── Toasts ───────────────────────────────────────────────────
function Toasts({ toasts }) {
  return (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:2000,display:'flex',flexDirection:'column',gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==='error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${t.type==='error'?'#fca5a5':'#86efac'}`,
          color: t.type==='error' ? '#ef4444' : '#16a34a',
          padding:'10px 16px',borderRadius:12,fontSize:'0.85rem',fontWeight:500,
          boxShadow:'0 4px 16px rgba(0,0,0,.1)',animation:'slideUp .2s ease',
          display:'flex',alignItems:'center',gap:8,
        }}>
          {t.type==='error'?'⚠️':'✓'} {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─── Tiny donut chart (SVG) ───────────────────────────────────
function Donut({ pct, color='#c8f04c', size=72, stroke=8 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray .6s ease' }} />
    </svg>
  )
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore()
  const { toasts, add: addToast } = useToast()

  // data
  const [classes,   setClasses]   = useState([])
  const [students,  setStudents]  = useState([])
  const [todayAtt,  setTodayAtt]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)

  // active tab: 'overview' | 'classes'
  const [tab, setTab] = useState('overview')

  // class management state
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)

  // ── load ──
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, cRes] = await Promise.all([
        client.get('/students/'),
        client.get('/classes/'),
      ])
      setStudents(sRes.data)
      setClasses(cRes.data)

      // today's attendance from first class
      if (cRes.data.length > 0) {
        try {
          const id = cRes.data[0]._id || cRes.data[0].unit_code
          const aRes = await client.get(`/attendance/class/${id}/date/${todayStr()}`)
          setTodayAtt(aRes.data)
        } catch { setTodayAtt([]) }
      }
    } catch { addToast('Failed to load data', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── class CRUD ──
  const handleAdd = async form => {
    setSaving(true)
    try {
      await client.post('/classes/', form)
      addToast('Class added')
      setShowAdd(false)
      loadData()
    } catch (e) { addToast(e.response?.data?.detail || 'Failed to add class','error') }
    finally { setSaving(false) }
  }
  const handleEdit = async form => {
    setSaving(true)
    try {
      await client.patch(`/classes/${editing._id}`, form)
      addToast('Class updated')
      setEditing(null)
      loadData()
    } catch (e) { addToast(e.response?.data?.detail || 'Failed to update','error') }
    finally { setSaving(false) }
  }
  const handleDelete = async () => {
    setSaving(true)
    try {
      await client.delete(`/classes/${deleting._id}`)
      addToast('Class deleted')
      setDeleting(null)
      loadData()
    } catch (e) { addToast(e.response?.data?.detail || 'Failed to delete','error') }
    finally { setSaving(false) }
  }

  // ── derived stats ──
  const present  = todayAtt.filter(r => r.status === 'present').length
  const absent   = todayAtt.filter(r => r.status === 'absent').length
  const late     = todayAtt.filter(r => r.status === 'late').length
  const attRate  = todayAtt.length ? Math.round((present / todayAtt.length) * 100) : 0

  // group classes by school
  const filtered = classes.filter(c =>
    `${c.lesson_name} ${c.unit_code} ${c.school} ${c.department}`
      .toLowerCase().includes(search.toLowerCase())
  )
  const grouped = filtered.reduce((acc, c) => {
    const k = c.school || 'Unknown'
    ;(acc[k] = acc[k] || []).push(c)
    return acc
  }, {})
  const schoolList = Object.keys(grouped)

  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'there'
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Lecturer'

  // ── shared inline styles ──
  const card = (extra={}) => ({
    background:'#fff', borderRadius:16, border:'1px solid #f0f0f0',
    overflow:'hidden', ...extra,
  })
  const tabBtn = (active) => ({
    padding:'8px 20px', borderRadius:100, border:'none', cursor:'pointer',
    fontFamily:'inherit', fontSize:'0.85rem', fontWeight:600,
    background: active ? '#0a0a0f' : 'transparent',
    color: active ? '#fff' : '#888',
    transition:'all .18s',
  })

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0}      to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .skel { background:#f0f0f0; border-radius:8px; animation:skelPulse 1.4s ease infinite; }
        .row-hover:hover { background:#fafafa !important; }
        .act-btn {
          padding:5px 12px; border-radius:8px; border:1px solid #e8e8e8;
          background:#fff; cursor:pointer; font-size:0.75rem; font-weight:600;
          transition:all .15s; font-family:inherit; color:#444;
        }
        .act-btn:hover { background:#0a0a0f; color:#fff; border-color:#0a0a0f; }
        .act-btn.del:hover { background:#ef4444; color:#fff; border-color:#ef4444; }
        .scroll-x { overflow-x:auto; }
        .scroll-x::-webkit-scrollbar { height:4px; }
        .scroll-x::-webkit-scrollbar-track { background:transparent; }
        .scroll-x::-webkit-scrollbar-thumb { background:#e0e0e0; border-radius:2px; }
      `}</style>

      {/* ── PAGE WRAPPER ── */}
      <div style={{ minHeight:'100vh', background:'#f7f7f5', fontFamily:"'DM Sans',sans-serif" }}>

        {/* ── TOP BAR ── */}
        <div style={{
          background:'#fff', borderBottom:'1px solid #f0f0f0',
          padding:'0 32px', display:'flex', alignItems:'center',
          justifyContent:'space-between', height:60, position:'sticky', top:0, zIndex:50,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:24 }}>
            <span style={{ fontWeight:800,fontSize:'1.1rem',letterSpacing:'-0.03em',color:'#0a0a0f' }}>
              AttendIQ
            </span>
            {/* Tab switcher */}
            <div style={{ display:'flex',gap:4,background:'#f5f5f5',borderRadius:100,padding:4 }}>
              {[['overview','Overview'],['classes','My Classes']].map(([v,l]) => (
                <button key={v} style={tabBtn(tab===v)} onClick={()=>setTab(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:'0.78rem',color:'#aaa' }}>{todayLabel}</span>
            <div style={{
              width:32,height:32,borderRadius:'50%',background:'#0a0a0f',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'0.75rem',fontWeight:700,color:'#c8f04c',
            }}>
              {firstName[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px 48px' }}>

          {/* ════════════════ OVERVIEW TAB ════════════════ */}
          {tab === 'overview' && (
            <div style={{ animation:'slideUp .3s ease' }}>

              {/* Welcome hero */}
              <div style={{
                ...card(),
                background:'#0a0a0f', border:'none',
                padding:'28px 32px', marginBottom:20,
                display:'flex', alignItems:'center', justifyContent:'space-between',
                flexWrap:'wrap', gap:16,
              }}>
                <div>
                  <div style={{ fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#666',marginBottom:8 }}>
                    {roleLabel} Dashboard
                  </div>
                  <div style={{ fontSize:'1.75rem',fontWeight:800,letterSpacing:'-0.04em',color:'#fff',lineHeight:1.1 }}>
                    Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'},
                    {' '}{firstName} 👋
                  </div>
                  <div style={{ fontSize:'0.82rem',color:'#555',marginTop:8 }}>
                    {classes.length} active class{classes.length!==1?'es':''} across {schoolList.length || Object.keys(
                      classes.reduce((a,c)=>{a[c.school||'?']=1;return a},{})).length} institution{schoolList.length!==1?'s':''}
                  </div>
                </div>
                <button onClick={()=>{ setTab('classes'); setShowAdd(true) }}
                  style={{
                    padding:'11px 24px',background:'#c8f04c',border:'none',borderRadius:100,
                    fontWeight:700,fontSize:'0.85rem',cursor:'pointer',letterSpacing:'-0.01em',
                    transition:'transform .15s',fontFamily:'inherit',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                  + Add Class
                </button>
              </div>

              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { label:'Total Students', value: loading?'—':students.length, icon:'👥', accent:'#4cf0b8' },
                  { label:'Active Classes',  value: loading?'—':classes.length,  icon:'📚', accent:'#c8f04c' },
                  { label:'Present Today',   value: loading?'—':present,          icon:'✅', accent:'#4c8cf0' },
                  { label:'Today\'s Rate',   value: loading?'—':`${attRate}%`,    icon:'📊', accent:'#f0c84c' },
                ].map((s,i) => (
                  <div key={i} style={{ ...card(), padding:'20px 22px' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                      <span style={{ fontSize:'0.72rem',color:'#aaa',fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase' }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
                    </div>
                    {loading
                      ? <div className="skel" style={{ height:28,width:60 }} />
                      : <div style={{ fontSize:'1.8rem',fontWeight:800,letterSpacing:'-0.04em',color:'#0a0a0f',lineHeight:1 }}>
                          {s.value}
                        </div>
                    }
                    <div style={{ height:3,background:s.accent,borderRadius:2,marginTop:14,opacity:.7 }} />
                  </div>
                ))}
              </div>

              {/* Middle row: Today breakdown + Donut + Recent */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 220px 1fr',gap:12,marginBottom:20 }}>

                {/* Today's breakdown bar */}
                <div style={{ ...card(), padding:'22px 24px' }}>
                  <div style={{ fontWeight:700,fontSize:'0.9rem',letterSpacing:'-0.02em',marginBottom:4 }}>Today's Attendance</div>
                  <div style={{ fontSize:'0.75rem',color:'#aaa',marginBottom:18 }}>
                    {todayAtt.length} records · {classes[0]?.lesson_name || 'first class'}
                  </div>
                  {loading ? (
                    [...Array(3)].map((_,i) => <div key={i} className="skel" style={{ height:12,marginBottom:10 }} />)
                  ) : todayAtt.length === 0 ? (
                    <div style={{ textAlign:'center',color:'#ccc',padding:'20px 0',fontSize:'0.85rem' }}>
                      No records for today yet
                    </div>
                  ) : (
                    <>
                      {[['present',present,'#c8f04c'],['absent',absent,'#f87171'],['late',late,'#fbbf24']].map(([k,v,col])=>(
                        <div key={k} style={{ marginBottom:12 }}>
                          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                            <span style={{ fontSize:'0.78rem',fontWeight:600,textTransform:'capitalize',color:'#555' }}>{k}</span>
                            <span style={{ fontSize:'0.78rem',fontWeight:700,color:'#0a0a0f' }}>{v}</span>
                          </div>
                          <div style={{ height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden' }}>
                            <div style={{ height:'100%',width:`${todayAtt.length?((v/todayAtt.length)*100):0}%`,
                              background:col,borderRadius:3,transition:'width .6s ease' }} />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Donut */}
                <div style={{ ...card(), padding:'22px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Donut pct={attRate} color='#c8f04c' size={96} stroke={10} />
                    <div style={{ position:'absolute', textAlign:'center' }}>
                      <div style={{ fontSize:'1.3rem',fontWeight:800,letterSpacing:'-0.04em' }}>{loading?'—':`${attRate}%`}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'0.72rem',color:'#aaa',marginTop:12,textAlign:'center',lineHeight:1.5 }}>
                    Attendance<br/>rate today
                  </div>
                </div>

                {/* Recent records */}
                <div style={{ ...card(), overflow:'hidden' }}>
                  <div style={{ padding:'18px 22px 12px', borderBottom:'1px solid #f5f5f5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontWeight:700,fontSize:'0.9rem',letterSpacing:'-0.02em' }}>Recent Records</div>
                    <span style={{ fontSize:'0.72rem',color:'#aaa' }}>Today</span>
                  </div>
                  <div style={{ overflowY:'auto', maxHeight:200 }}>
                    {loading ? [...Array(4)].map((_,i)=>(
                      <div key={i} style={{ padding:'10px 22px',display:'flex',gap:10,alignItems:'center' }}>
                        <div className="skel" style={{ width:28,height:28,borderRadius:'50%' }} />
                        <div className="skel" style={{ flex:1,height:12 }} />
                      </div>
                    )) : todayAtt.length === 0 ? (
                      <div style={{ padding:'24px',textAlign:'center',color:'#ccc',fontSize:'0.82rem' }}>
                        No records yet
                      </div>
                    ) : todayAtt.slice(0,10).map((r,i) => (
                      <div key={i} style={{
                        padding:'9px 22px',display:'flex',alignItems:'center',
                        justifyContent:'space-between',
                        borderBottom: i<todayAtt.length-1?'1px solid #fafafa':'none',
                      }}>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <div style={{
                            width:28,height:28,borderRadius:'50%',
                            background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:'0.65rem',fontWeight:700,color:'#888',
                          }}>
                            {r.student_id?.slice(-2)}
                          </div>
                          <span style={{ fontSize:'0.8rem',fontWeight:500 }}>{r.student_id}</span>
                        </div>
                        <span style={{
                          fontSize:'0.7rem',fontWeight:600,padding:'2px 8px',borderRadius:100,
                          background: STATUS_BG[r.status]||'#f5f5f5',
                          color: STATUS_COLOR[r.status]||'#888',
                          textTransform:'capitalize',
                        }}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Classes quick list */}
              <div style={{ ...card() }}>
                <div style={{
                  padding:'18px 24px', borderBottom:'1px solid #f5f5f5',
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:'0.9rem',letterSpacing:'-0.02em' }}>My Classes</div>
                    <div style={{ fontSize:'0.74rem',color:'#aaa',marginTop:2 }}>Across all institutions</div>
                  </div>
                  <button onClick={()=>setTab('classes')} style={{
                    padding:'7px 16px',border:'1.5px solid #e8e8e8',borderRadius:100,
                    background:'#fff',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,
                    fontFamily:'inherit',transition:'all .15s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#0a0a0f';e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='#0a0a0f'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#0a0a0f';e.currentTarget.style.borderColor='#e8e8e8'}}>
                    Manage all →
                  </button>
                </div>
                <div className="scroll-x">
                  <div style={{ display:'flex',gap:12,padding:'16px 24px',minWidth:'max-content' }}>
                    {loading ? [...Array(3)].map((_,i)=>(
                      <div key={i} className="skel" style={{ width:180,height:90,borderRadius:12 }} />
                    )) : classes.length === 0 ? (
                      <div style={{ padding:'16px',color:'#ccc',fontSize:'0.85rem' }}>No classes yet</div>
                    ) : classes.map((c,i) => (
                      <div key={c._id} onClick={()=>{ setTab('classes'); setEditing(c) }}
                        style={{
                          width:188, padding:'14px 16px', borderRadius:14, cursor:'pointer',
                          border:'1.5px solid #f0f0f0', background:'#fff', flexShrink:0,
                          transition:'all .15s',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#0a0a0f';e.currentTarget.style.transform='translateY(-2px)'}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0f0f0';e.currentTarget.style.transform='none'}}>
                        <div style={{
                          width:32,height:32,borderRadius:8,marginBottom:10,
                          background: SCHOOL_COLORS[i%SCHOOL_COLORS.length],
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:'0.6rem',fontWeight:800,color:'#0a0a0f',letterSpacing:'-0.02em',
                        }}>
                          {c.unit_code?.slice(0,4)}
                        </div>
                        <div style={{ fontSize:'0.82rem',fontWeight:600,marginBottom:4,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {c.lesson_name}
                        </div>
                        <div style={{ fontSize:'0.68rem',color:'#aaa' }}>{c.school}</div>
                      </div>
                    ))}
                    {/* add card */}
                    <div onClick={()=>{ setTab('classes'); setShowAdd(true) }}
                      style={{
                        width:188,padding:'14px 16px',borderRadius:14,cursor:'pointer',
                        border:'1.5px dashed #ddd',background:'#fafafa',flexShrink:0,
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                        gap:8,transition:'all .15s',color:'#aaa',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='#0a0a0f';e.currentTarget.style.color='#0a0a0f'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='#ddd';e.currentTarget.style.color='#aaa'}}>
                      <span style={{ fontSize:'1.5rem' }}>+</span>
                      <span style={{ fontSize:'0.78rem',fontWeight:600 }}>Add class</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ CLASSES TAB ════════════════ */}
          {tab === 'classes' && (
            <div style={{ animation:'slideUp .3s ease' }}>

              {/* Header */}
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12 }}>
                <div>
                  <div style={{ fontSize:'1.5rem',fontWeight:800,letterSpacing:'-0.04em',color:'#0a0a0f' }}>My Classes</div>
                  <div style={{ fontSize:'0.82rem',color:'#aaa',marginTop:4 }}>
                    {classes.length} class{classes.length!==1?'es':''} across {Object.keys(grouped).length || '—'} institution{Object.keys(grouped).length!==1?'s':''}
                  </div>
                </div>
                <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                  <input
                    placeholder="Search classes…"
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    style={{
                      padding:'9px 15px',border:'1.5px solid #e8e8e8',borderRadius:100,
                      fontSize:'0.85rem',outline:'none',width:220,fontFamily:'inherit',
                    }}
                    onFocus={e=>e.target.style.borderColor='#0a0a0f'}
                    onBlur={e=>e.target.style.borderColor='#e8e8e8'}
                  />
                  <button onClick={()=>setShowAdd(true)} style={{
                    padding:'9px 22px',background:'#0a0a0f',color:'#fff',border:'none',
                    borderRadius:100,cursor:'pointer',fontSize:'0.85rem',fontWeight:700,
                    fontFamily:'inherit',transition:'transform .15s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                    + Add Class
                  </button>
                </div>
              </div>

              {/* Empty */}
              {!loading && classes.length === 0 && (
                <div style={{ ...card(), padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ fontSize:'3rem',marginBottom:16 }}>📚</div>
                  <div style={{ fontWeight:700,fontSize:'1.1rem',marginBottom:8 }}>No classes yet</div>
                  <div style={{ color:'#aaa',fontSize:'0.85rem',marginBottom:24 }}>
                    Add a class you teach to start tracking attendance.
                  </div>
                  <button onClick={()=>setShowAdd(true)} style={{
                    padding:'11px 28px',background:'#0a0a0f',color:'#fff',border:'none',
                    borderRadius:100,cursor:'pointer',fontSize:'0.875rem',fontWeight:700,fontFamily:'inherit',
                  }}>+ Add Your First Class</button>
                </div>
              )}

              {/* Skeletons */}
              {loading && [...Array(2)].map((_,i) => (
                <div key={i} style={{ ...card(), marginBottom:14, padding:'16px 24px' }}>
                  <div className="skel" style={{ height:14,width:'30%',marginBottom:16 }} />
                  {[1,2].map(j => (
                    <div key={j} style={{ display:'flex',gap:14,alignItems:'center',padding:'12px 0',borderTop:'1px solid #fafafa' }}>
                      <div className="skel" style={{ width:44,height:44,borderRadius:10 }} />
                      <div style={{ flex:1 }}>
                        <div className="skel" style={{ height:13,width:'55%',marginBottom:7 }} />
                        <div className="skel" style={{ height:11,width:'35%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Grouped list */}
              {!loading && Object.entries(grouped).map(([school, list], si) => (
                <div key={school} style={{ ...card(), marginBottom:14, overflow:'visible' }}>
                  {/* school header */}
                  <div style={{
                    padding:'13px 24px', borderBottom:'1px solid #f5f5f5',
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                  }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{
                        width:10,height:10,borderRadius:'50%',flexShrink:0,
                        background: SCHOOL_COLORS[si%SCHOOL_COLORS.length],
                      }} />
                      <span style={{ fontWeight:700,fontSize:'0.875rem' }}>{school}</span>
                    </div>
                    <span style={{ fontSize:'0.72rem',color:'#bbb',fontWeight:600 }}>
                      {list.length} class{list.length!==1?'es':''}
                    </span>
                  </div>

                  {/* rows */}
                  {list.map((c,i) => (
                    <div key={c._id} className="row-hover" style={{
                      padding:'13px 24px',display:'flex',alignItems:'center',gap:16,
                      borderBottom: i<list.length-1?'1px solid #fafafa':'none',
                      transition:'background .1s',
                    }}>
                      <div style={{
                        width:46,height:46,flexShrink:0,borderRadius:12,
                        background: SCHOOL_COLORS[si%SCHOOL_COLORS.length]+'33',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontWeight:800,fontSize:'0.58rem',color:'#0a0a0f',
                        letterSpacing:'-0.01em',textAlign:'center',padding:4,
                      }}>{c.unit_code}</div>

                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:600,fontSize:'0.875rem',marginBottom:3,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {c.lesson_name}
                        </div>
                        <div style={{ fontSize:'0.72rem',color:'#aaa',display:'flex',gap:14,flexWrap:'wrap' }}>
                          <span>{c.department}</span>
                          {c.schedule && <span>🕐 {c.schedule}</span>}
                          {c.venue    && <span>📍 {c.venue}</span>}
                        </div>
                      </div>

                      {c.credit_hours && (
                        <span style={{
                          padding:'3px 10px',border:'1px solid #e8e8e8',borderRadius:100,
                          fontSize:'0.72rem',fontWeight:600,color:'#555',flexShrink:0,
                        }}>{c.credit_hours} cr</span>
                      )}

                      <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                        <button className="act-btn" onClick={()=>setEditing(c)}>Edit</button>
                        <button className="act-btn del" onClick={()=>setDeleting(c)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {showAdd && (
        <Modal title="Add New Class" onClose={()=>setShowAdd(false)}>
          <ClassForm onSubmit={handleAdd} onCancel={()=>setShowAdd(false)} saving={saving} />
        </Modal>
      )}
      {editing && (
        <Modal title={`Edit — ${editing.unit_code}`} onClose={()=>setEditing(null)}>
          <ClassForm initial={editing} onSubmit={handleEdit} onCancel={()=>setEditing(null)} saving={saving} />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete Class?" onClose={()=>setDeleting(null)} width={400}>
          <p style={{ fontSize:'0.875rem',color:'#666',marginBottom:20,lineHeight:1.6 }}>
            Delete <strong>{deleting.lesson_name}</strong> ({deleting.unit_code})?
            This cannot be undone.
          </p>
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <button onClick={()=>setDeleting(null)} style={{
              padding:'9px 20px',border:'1.5px solid #e8e8e8',borderRadius:10,
              background:'#fff',cursor:'pointer',fontSize:'0.85rem',fontFamily:'inherit',
            }}>Cancel</button>
            <button onClick={handleDelete} disabled={saving} style={{
              padding:'9px 20px',background:'#ef4444',color:'#fff',border:'none',
              borderRadius:10,cursor:'pointer',fontSize:'0.85rem',fontWeight:600,fontFamily:'inherit',
              opacity:saving?.6:1,
            }}>{saving?'Deleting…':'Yes, Delete'}</button>
          </div>
        </Modal>
      )}

      <Toasts toasts={toasts} />
    </>
  )
}