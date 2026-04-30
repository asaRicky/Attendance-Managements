import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast, Toasts } from '../hooks/useToast'


const SCHOOLS = [
  'Strathmore University', 'University of Nairobi', 'Kenyatta University',
  'JKUAT', 'Moi University', 'Egerton University', 'KCA University',
  'Daystar University', 'Kabarak University', 'Mount Kenya University', 'Other',
]

const SCHOOL_COLORS = {
  'Strathmore University':  '#3b82f6', 'University of Nairobi': '#22c55e',
  'KCA University':         '#06b6d4', 'JKUAT':                 '#ef4444',
  'Kenyatta University':    '#a855f7', 'Moi University':        '#f97316',
  'Egerton University':     '#10b981', 'Daystar University':    '#ec4899',
  'Kabarak University':     '#f59e0b', 'Mount Kenya University':'#8b5cf6',
  'Other':                  '#6b7280',
}
const schoolColor = s => SCHOOL_COLORS[s] ?? '#3b82f6'

const DAYS_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DAYS_FULL  = { Mo:'Mon', Tu:'Tue', We:'Wed', Th:'Thu', Fr:'Fri', Sa:'Sat', Su:'Sun' }

const DAY_PRESETS = [
  { label:'Mon–Fri',     days:['Mo','Tu','We','Th','Fr'] },
  { label:'Mon/Wed/Fri', days:['Mo','We','Fr'] },
  { label:'Tue/Thu',     days:['Tu','Th'] },
  { label:'Weekends',    days:['Sa','Su'] },
]

const EMPTY_FORM = {
  lesson_name:'', unit_code:'', school:'Strathmore University',
  department:'', description:'', venue:'', credit_hours:'3',
}

const EMPTY_TIME  = { hour:8, min:0, ampm:'AM', mode:'hour' }
const EMPTY_SCHED = { days:[], start:{ ...EMPTY_TIME }, end:{ ...EMPTY_TIME, hour:10 } }

const fmtTime = ({ hour, min, ampm }) =>
  `${hour % 12 || 12}:${String(min).padStart(2, '0')} ${ampm}`

const to24 = (h12, ampm) =>
  ampm === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12)

const buildSchedule = (days, start, end) => {
  if (!days.length) return ''
  const dayStr = [...days]
    .sort((a, b) => DAYS_SHORT.indexOf(a) - DAYS_SHORT.indexOf(b))
    .map(d => DAYS_FULL[d]).join('/')
  return `${dayStr} ${fmtTime(start)}–${fmtTime(end)}`
}

const plural = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`


const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 2l10 10M12 2L2 12"/>
  </svg>
)

function Modal({ id, onClose, maxWidth = 480, title, subtitle, footer, children }) {
  return (
    <div
      className="overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-labelledby={id}
    >
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-h">
          <div>
            <span className="modal-title" id={id}>{title}</span>
            {subtitle && (
              <div style={{ fontSize:'.66rem', fontFamily:'var(--mono)', color:'var(--ink3)', marginTop:3 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close modal">
            <XIcon/>
          </button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  )
}

function Field({ label, error, span, children }) {
  return (
    <div className="fg" style={span ? { gridColumn:'1/-1' } : {}}>
      <label className="fl">{label}</label>
      {children}
      {error && (
        <div style={{ fontSize:'.67rem', color:'var(--danger)', marginTop:4, fontFamily:'var(--mono)' }}>
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

function MetaChip({ label, value }) {
  return (
    <div style={{ background:'var(--bg3)', borderRadius:'var(--r)', padding:'11px 14px' }}>
      <div style={{ fontSize:'.56rem', fontFamily:'var(--mono)', color:'var(--ink3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:4 }}>
        {label}
      </div>
      <div style={{ fontSize:'.84rem', fontWeight:600 }}>{value}</div>
    </div>
  )
}


function ClockFace({ state, onChange }) {
  const isHour  = state.mode === 'hour'
  const numbers = isHour ? [12,1,2,3,4,5,6,7,8,9,10,11] : [0,5,10,15,20,25,30,35,40,45,50,55]
  const cx = 90, cy = 90, R = 72

  const handRad = ((isHour ? ((state.hour % 12) / 12) * 360 : (state.min / 60) * 360) - 90) * Math.PI / 180
  const handX = cx + R * Math.cos(handRad)
  const handY = cy + R * Math.sin(handRad)

  const pickFromAngle = (deg) => {
    if (isHour) {
      const h12 = Math.round(deg / 30) % 12 || 12
      onChange({ ...state, hour: to24(h12, state.ampm), mode:'min' })
    } else {
      const snapped = Math.round(Math.round(deg / 6) % 60 / 5) * 5 % 60
      onChange({ ...state, min: snapped })
    }
  }

  const handleSvgClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    pickFromAngle((Math.atan2(e.clientY - r.top - cy, e.clientX - r.left - cx) * 180 / Math.PI + 90 + 360) % 360)
  }

  return (
    <svg
      width="180" height="180" viewBox="0 0 180 180"
      style={{ cursor:'crosshair', userSelect:'none', display:'block', margin:'0 auto' }}
      onClick={handleSvgClick}
    >
      <circle cx={cx} cy={cy} r={88} fill="var(--bg4)" stroke="var(--br2)" strokeWidth="1.5"/>

      {Array.from({ length:60 }, (_, i) => {
        const a = (i / 60) * 2 * Math.PI - Math.PI / 2
        const maj = i % 5 === 0
        return <line key={i}
          x1={cx + 82*Math.cos(a)} y1={cy + 82*Math.sin(a)}
          x2={cx + (maj?74:78)*Math.cos(a)} y2={cy + (maj?74:78)*Math.sin(a)}
          stroke={maj ? 'var(--br2)' : 'var(--br)'} strokeWidth={maj ? 1.5 : 1}
        />
      })}

      {numbers.map((n, i) => {
        const a      = (i / 12) * 2 * Math.PI - Math.PI / 2
        const nx     = cx + 64 * Math.cos(a)
        const ny     = cy + 64 * Math.sin(a)
        const active = isHour ? (state.hour % 12 || 12) === n : state.min === n
        return (
          <g key={n} style={{ cursor:'pointer' }} onClick={e => {
            e.stopPropagation()
            if (isHour) onChange({ ...state, hour: to24(n, state.ampm), mode:'min' })
            else        onChange({ ...state, min: n })
          }}>
            {active && <circle cx={nx} cy={ny} r={13} fill="var(--accent)" opacity=".9"/>}
            <text
              x={nx} y={ny} textAnchor="middle" dominantBaseline="central"
              fontSize="10" fontFamily="var(--mono)" fontWeight={active ? '700' : '500'}
              fill={active ? '#fff' : 'var(--ink3)'} style={{ pointerEvents:'none' }}
            >
              {isHour ? n : String(n).padStart(2, '0')}
            </text>
          </g>
        )
      })}

      <line x1={cx} y1={cy} x2={handX} y2={handY}
        stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"
        style={{ transition:'x2 .15s,y2 .15s' }}
      />
      <circle cx={cx} cy={cy} r={5} fill="var(--accent)"/>
    </svg>
  )
}

function TimePicker({ state, onChange }) {
  const seg = (active) => ({
    padding:'2px 8px', borderRadius:8, cursor:'pointer', transition:'all 120ms',
    color:       active ? 'var(--accent)' : 'var(--ink)',
    background:  active ? 'rgba(var(--accent-rgb),.12)' : 'transparent',
  })

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:'2rem', fontFamily:'var(--mono)', fontWeight:700, letterSpacing:'.04em' }}>
          <span style={seg(state.mode === 'hour')} onClick={() => onChange({ ...state, mode:'hour' })}>
            {state.hour % 12 || 12}
          </span>
          <span style={{ color:'var(--ink3)', fontSize:'1.4rem' }}>:</span>
          <span style={seg(state.mode === 'min')} onClick={() => onChange({ ...state, mode:'min' })}>
            {String(state.min).padStart(2, '0')}
          </span>
          <button type="button"
            onClick={() => onChange({ ...state, ampm: state.ampm === 'AM' ? 'PM' : 'AM' })}
            style={{
              marginLeft:6, padding:'4px 10px', borderRadius:20,
              fontSize:'.72rem', fontFamily:'var(--mono)', fontWeight:700,
              background:'var(--bg4)', border:'1.5px solid var(--br2)',
              color:'var(--ink2)', cursor:'pointer', transition:'all 120ms',
            }}
          >{state.ampm}</button>
        </div>
        <div style={{ fontSize:'.62rem', color:'var(--ink3)', fontFamily:'var(--mono)', marginTop:4 }}>
          tap {state.mode === 'hour' ? 'hour to switch to minutes' : 'minute to adjust'}
        </div>
      </div>
      <ClockFace state={state} onChange={onChange}/>
    </div>
  )
}

function SchedulePicker({ value, onChange }) {
  const [tab,   setTab]   = useState('days')
  const [days,  setDays]  = useState([])
  const [start, setStart] = useState({ ...EMPTY_SCHED.start })
  const [end,   setEnd]   = useState({ ...EMPTY_SCHED.end })

  useEffect(() => {
    if (value) setDays(DAYS_SHORT.filter(d => value.includes(DAYS_FULL[d])))
  }, []) 

  useEffect(() => { onChange(buildSchedule(days, start, end)) }, [days, start, end])

  const toggleDay  = (d) => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  const resetPicker = () => { setDays([]); setStart({ ...EMPTY_SCHED.start }); setEnd({ ...EMPTY_SCHED.end }) }
  const preview     = buildSchedule(days, start, end)

  const TABS = [
    { id:'days',  label:'📅 Days'  },
    { id:'start', label:'🕐 Start' },
    { id:'end',   label:'🕕 End'   },
  ]

  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--br2)', borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'flex', borderBottom:'1px solid var(--br)' }}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            flex:1, padding:'9px 4px', fontSize:'.72rem', fontWeight:600, cursor:'pointer',
            fontFamily:'var(--body)', border:'none', transition:'all 120ms',
            background:    tab === t.id ? 'rgba(var(--accent-rgb),.08)' : 'transparent',
            color:         tab === t.id ? 'var(--accent)' : 'var(--ink3)',
            borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:16 }}>

        {tab === 'days' && (
          <div>
            <div style={{ fontSize:'.68rem', color:'var(--ink3)', marginBottom:12, fontFamily:'var(--mono)' }}>
              Select which days this class meets
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
              {DAYS_SHORT.map(d => {
                const on = days.includes(d)
                return (
                  <button key={d} type="button" onClick={() => toggleDay(d)} aria-pressed={on} style={{
                    width:42, height:42, borderRadius:'50%', cursor:'pointer', transition:'all 150ms',
                    fontFamily:'var(--mono)', fontSize:'.72rem', fontWeight:700,
                    background:  on ? 'var(--accent)' : 'var(--bg4)',
                    border:     `2px solid ${on ? 'var(--accent)' : 'var(--br2)'}`,
                    color:       on ? '#fff' : 'var(--ink3)',
                    boxShadow:   on ? '0 0 14px rgba(var(--accent-rgb),.35)' : 'none',
                    transform:   on ? 'scale(1.08)' : 'scale(1)',
                  }}>{d}</button>
                )
              })}
            </div>

            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              {DAY_PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => setDays(p.days)} style={{
                  padding:'4px 10px', borderRadius:20, fontSize:'.65rem', cursor:'pointer',
                  fontFamily:'var(--mono)', fontWeight:500, transition:'all 100ms',
                  background:'var(--bg4)', border:'1px solid var(--br2)', color:'var(--ink3)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--br2)';    e.currentTarget.style.color = 'var(--ink3)'  }}
                >{p.label}</button>
              ))}
            </div>

            <div style={{ textAlign:'right' }}>
              <button type="button" onClick={() => setTab('start')} disabled={!days.length} style={{
                padding:'6px 14px', borderRadius:8, fontSize:'.76rem', fontWeight:600,
                border:'none', transition:'all 120ms',
                background: days.length ? 'var(--accent)' : 'var(--bg4)',
                color:      days.length ? '#fff'          : 'var(--ink3)',
                opacity:    days.length ? 1               : .5,
                cursor:     days.length ? 'pointer'       : 'not-allowed',
              }}>Set Start Time →</button>
            </div>
          </div>
        )}

        {tab === 'start' && (
          <div>
            <TimePicker state={start} onChange={setStart}/>
            <div style={{ textAlign:'right', marginTop:10 }}>
              <button type="button" onClick={() => setTab('end')} style={{
                padding:'6px 14px', borderRadius:8, fontSize:'.76rem', fontWeight:600,
                background:'var(--accent)', border:'none', color:'#fff', cursor:'pointer',
              }}>Set End Time →</button>
            </div>
          </div>
        )}

        {tab === 'end' && <TimePicker state={end} onChange={setEnd}/>}

        <div style={{ marginTop:14, padding:'9px 12px', background:'var(--bg4)', borderRadius:8, display:'flex', alignItems:'center', gap:8, minHeight:38 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--accent)" strokeWidth="1.6">
            <rect x=".5" y="1.5" width="11" height="9" rx="2"/><path d="M3.5.5v2M8.5.5v2M.5 5.5h11"/>
          </svg>
          <span style={{ fontSize:'.72rem', fontFamily:'var(--mono)', color: preview ? 'var(--ink2)' : 'var(--ink3)', flex:1 }}>
            {preview || 'Select days and times above'}
          </span>
          {preview && (
            <button type="button" onClick={resetPicker} style={{
              fontSize:'.6rem', fontFamily:'var(--mono)', padding:'2px 7px', borderRadius:20,
              border:'1px solid var(--br2)', background:'transparent', color:'var(--ink3)', cursor:'pointer',
            }}>clear</button>
          )}
        </div>

      </div>
    </div>
  )
}


export default function Courses() {
  const navigate = useNavigate()
  const { toasts, toast } = useToast()

  const [courses,  setCourses]  = useState([])
  const [search,   setSearch]   = useState('')
  const [fSchool,  setFSchool]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   
  const [sel,      setSel]      = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [errors,   setErrors]   = useState({})
  const [schedule, setSchedule] = useState('')
  const [saving,   setSaving]   = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/classes/')
      setCourses(r.data)
    } catch (e) {
      console.error('load courses:', e)
      toast('Failed to load courses', 'err')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return courses.filter(c =>
      (!q || `${c.lesson_name} ${c.unit_code} ${c.school} ${c.department} ${c.description}`.toLowerCase().includes(q)) &&
      (!fSchool || c.school === fSchool)
    )
  }, [courses, search, fSchool])

  const grouped = useMemo(() =>
    filtered.reduce((acc, c) => { const k = c.school || 'Other'; (acc[k] ??= []).push(c); return acc }, {})
  , [filtered])


  const setField = useCallback((k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }, [])

  function validate() {
    const e = {}
    if (!form.lesson_name.trim()) e.lesson_name = 'Course name is required'
    if (!form.unit_code.trim())   e.unit_code   = 'Unit code is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const close = () => { setModal(null); setTimeout(() => setSel(null), 200) }

  function openAdd() {
    setForm(EMPTY_FORM); setSchedule(''); setErrors({}); setSel(null); setModal('add')
  }

  function openEdit(c) {
    setSel(c)
    setForm({
      lesson_name:  c.lesson_name  || '',
      unit_code:    c.unit_code    || '',
      school:       c.school       || 'Strathmore University',
      department:   c.department   || '',
      description:  c.description  || '',
      venue:        c.venue        || '',
      credit_hours: String(c.credit_hours || 3),
    })
    setSchedule(c.schedule || '')
    setErrors({})
    setModal('edit')
  }

  const openView = (c) => { setSel(c); setModal('view')   }
  const openDel  = (c) => { setSel(c); setModal('delete') }
  const goAttend = (c) =>
    navigate('/dashboard/attendance', { state: { courseId: c._id, courseName: c.lesson_name, unitCode: c.unit_code } })

  async function save() {
    if (!validate()) return
    setSaving(true)
    const payload = { ...form, schedule, credit_hours: parseInt(form.credit_hours, 10) || 3 }
    try {
      if (modal === 'add') {
        const r = await api.post('/classes/', payload)
        setCourses(p => [...p, r.data])
        toast(`${payload.lesson_name} added 🎉`)
      } else {
        const r = await api.patch(`/classes/${sel._id}`, payload)
        setCourses(p => p.map(c => c._id === sel._id ? { ...c, ...r.data } : c))
        toast('Course updated')
      }
      close()
    } catch (e) {
      console.error('save:', e)
      toast(e.response?.data?.detail || 'Failed to save', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function del() {
    if (!sel) return
    setSaving(true)
    const backup = courses
    setCourses(p => p.filter(c => c._id !== sel._id))
    close()
    try {
      await api.delete(`/classes/${sel._id}`)
      toast('Course deleted')
    } catch (e) {
      console.error('delete:', e)
      setCourses(backup)
      toast('Failed to delete', 'err')
    } finally {
      setSaving(false)
    }
  }


  const hasFilters = search || fSchool
  const clearFilters = () => { setSearch(''); setFSchool('') }

  return (
    <div className="page-in">
      <div className="topbar">
        <div className="tb-title">Courses</div>
        <div className="tb-meta">{loading ? '…' : plural(filtered.length, 'course')}</div>
      </div>

      <div className="body">
        <div className="sh">
          <div>
            <div className="sh-title">Course Registry</div>
            <div className="sh-sub">Manage all units across institutions</div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6.5 1v11M1 6.5h11"/>
            </svg>
            Add Course
          </button>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          <div className="search-wrap" style={{ flex:1 }}>
            <svg className="search-ico" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9L12 12"/>
            </svg>
            <input
              className="fc" placeholder="Search by name, code, school…"
              value={search} onChange={e => setSearch(e.target.value)} aria-label="Search courses"
            />
          </div>
          <select className="fc" style={{ width:200 }} value={fSchool}
            onChange={e => setFSchool(e.target.value)} aria-label="Filter by institution"
          >
            <option value="">All Institutions</option>
            {SCHOOLS.map(s => <option key={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ whiteSpace:'nowrap' }}>Clear</button>
          )}
        </div>

        {loading && (
          <div className="card" style={{ padding:24 }}>
            {[0,1,2].map(i => <div key={i} className="sk" style={{ height:52, marginBottom:10, borderRadius:10 }}/>)}
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="card">
            <div className="empty">
              <div style={{ fontSize:'2.2rem', marginBottom:10, opacity:.3 }}>📚</div>
              <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--ink)', marginBottom:5 }}>
                {hasFilters ? 'No courses match your filters' : 'No courses yet'}
              </div>
              <div style={{ fontSize:'.78rem', color:'var(--ink3)', lineHeight:1.7, maxWidth:300, margin:'0 auto 16px' }}>
                {hasFilters ? 'Try a different name or clear the filters.' : 'Add your first course to get started with attendance tracking.'}
              </div>
              {hasFilters
                ? <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear Filters</button>
                : <button className="btn btn-primary" onClick={openAdd}>Add Course</button>
              }
            </div>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([school, list]) => {
          const color = schoolColor(school)
          return (
            <div key={school} className="card card-flush" style={{ marginBottom:14 }}>
              <div style={{ padding:'11px 18px', borderBottom:'1px solid var(--br)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}88` }}/>
                  <span style={{ fontWeight:700, fontSize:'.88rem' }}>{school}</span>
                </div>
                <span style={{ fontSize:'.62rem', fontFamily:'var(--mono)', color:'var(--ink3)' }}>
                  {plural(list.length, 'course')}
                </span>
              </div>

              {list.map((c, i) => (
                <div
                  key={c._id}
                  role="button" tabIndex={0} aria-label={`View ${c.lesson_name}`}
                  onClick={() => openView(c)}
                  onKeyDown={e => e.key === 'Enter' && openView(c)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onFocus={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onBlur={e => e.currentTarget.style.background = 'transparent'}
                  style={{
                    padding:'13px 18px', display:'flex', alignItems:'center', gap:14,
                    borderBottom: i < list.length - 1 ? '1px solid var(--br)' : 'none',
                    transition:'background 120ms', cursor:'pointer', outline:'none',
                  }}
                >
                  <div style={{
                    width:48, height:48, flexShrink:0, borderRadius:11,
                    background:`${color}15`, border:`1px solid ${color}30`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--mono)', fontSize:'.52rem', fontWeight:700,
                    color, letterSpacing:'-.01em', textAlign:'center', padding:4, lineHeight:1.2,
                  }}>
                    {(c.unit_code || '').slice(0, 7)}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'.875rem', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {c.lesson_name}
                    </div>
                    <div style={{ fontSize:'.66rem', fontFamily:'var(--mono)', color:'var(--ink3)', display:'flex', gap:12, flexWrap:'wrap' }}>
                      {c.department && <span>{c.department}</span>}
                      {c.schedule   && <span>🕐 {c.schedule}</span>}
                      {c.venue      && <span>📍 {c.venue}</span>}
                    </div>
                    {c.description && (
                      <div style={{ fontSize:'.68rem', color:'var(--ink3)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:520 }}>
                        {c.description}
                      </div>
                    )}
                  </div>

                  <span className="badge b-muted" style={{ flexShrink:0 }}>{c.credit_hours || '—'} cr</span>

                  <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => goAttend(c)} aria-label={`Mark attendance for ${c.lesson_name}`}>Mark</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.lesson_name}`}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => openDel(c)} aria-label={`Delete ${c.lesson_name}`}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal
          id="formModalTitle" onClose={close} maxWidth={580}
          title={modal === 'add' ? 'Add New Course' : `Edit — ${sel?.unit_code}`}
          subtitle={modal === 'edit' ? sel?.school : null}
          footer={<>
            <button className="btn btn-outline" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : modal === 'add' ? 'Add Course' : 'Save Changes'}
            </button>
          </>}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>

            <Field label="Course Name" error={errors.lesson_name} span>
              <input className={`fc${errors.lesson_name ? ' fc-err' : ''}`}
                placeholder="e.g. Data Structures & Algorithms" autoFocus
                value={form.lesson_name} onChange={e => setField('lesson_name', e.target.value)}/>
            </Field>

            <Field label="Description" span>
              <textarea className="fc" rows={3} style={{ resize:'vertical', lineHeight:1.6 }}
                placeholder="Brief overview of course objectives and key topics…"
                value={form.description} onChange={e => setField('description', e.target.value)}/>
            </Field>

            <Field label="Unit Code" error={errors.unit_code}>
              <input className={`fc${errors.unit_code ? ' fc-err' : ''}`} placeholder="e.g. ICS3101"
                value={form.unit_code} onChange={e => setField('unit_code', e.target.value.toUpperCase())}/>
            </Field>

            <Field label="Credit Hours">
              <input className="fc" type="number" min="1" max="10" placeholder="3"
                value={form.credit_hours} onChange={e => setField('credit_hours', e.target.value)}/>
            </Field>

            <Field label="Institution" span>
              <select className="fc" value={form.school} onChange={e => setField('school', e.target.value)}>
                {SCHOOLS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Department">
              <input className="fc" placeholder="e.g. ICS, BBA, LLB"
                value={form.department} onChange={e => setField('department', e.target.value)}/>
            </Field>

            <Field label="Venue / Room">
              <input className="fc" placeholder="e.g. Lab 2, Koitalel Block"
                value={form.venue} onChange={e => setField('venue', e.target.value)}/>
            </Field>

            <Field label="Schedule" span>
              <SchedulePicker value={schedule} onChange={setSchedule}/>
              {schedule && (
                <div style={{ marginTop:6, fontSize:'.68rem', fontFamily:'var(--mono)', color:'var(--ink3)', padding:'4px 10px', background:'var(--bg3)', borderRadius:6, display:'inline-block' }}>
                  Saved: {schedule}
                </div>
              )}
            </Field>

          </div>
        </Modal>
      )}

      {modal === 'view' && sel && (
        <Modal
          id="viewModalTitle" onClose={close} maxWidth={480}
          title={sel.lesson_name}
          subtitle={`${sel.unit_code} · ${sel.school}`}
          footer={<>
            <button className="btn btn-outline" onClick={close}>Close</button>
            <button className="btn btn-ghost" onClick={() => openEdit(sel)}>Edit</button>
            <button className="btn btn-primary" onClick={() => goAttend(sel)}>Mark Attendance →</button>
          </>}
        >
          <div style={{
            background:'var(--bg3)', borderRadius:'var(--r)', padding:14, marginBottom:18,
            border: `1px ${sel.description ? 'solid var(--br2)' : 'dashed var(--br)'}`,
          }}>
            <div style={{ fontSize:'.58rem', fontFamily:'var(--mono)', color:'var(--ink3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:7 }}>
              About this course
            </div>
            {sel.description
              ? <p style={{ fontSize:'.84rem', color:'var(--ink2)', lineHeight:1.75 }}>{sel.description}</p>
              : <p style={{ fontSize:'.78rem', color:'var(--ink3)' }}>No description added yet.</p>
            }
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['Institution',  sel.school],
              ['Department',   sel.department   || '—'],
              ['Schedule',     sel.schedule     || '—'],
              ['Venue',        sel.venue        || '—'],
              ['Credit Hours', sel.credit_hours ? `${sel.credit_hours} credits` : '—'],
              ['Unit Code',    sel.unit_code    || '—'],
            ].map(([label, value]) => <MetaChip key={label} label={label} value={value}/>)}
          </div>
        </Modal>
      )}

      {modal === 'delete' && sel && (
        <Modal
          id="delModalTitle" onClose={close} maxWidth={380}
          title="Delete Course?"
          footer={<>
            <button className="btn btn-outline" onClick={close}>Cancel</button>
            <button className="btn btn-danger" onClick={del} disabled={saving}>
              {saving ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </>}
        >
          <p style={{ fontSize:'.84rem', color:'var(--ink2)', lineHeight:1.75 }}>
            Permanently delete{' '}
            <strong style={{ color:'var(--ink)' }}>{sel.lesson_name}</strong>
            {' '}({sel.unit_code})? All attendance records linked to this course will be affected.
          </p>
        </Modal>
      )}

      <Toasts toasts={toasts}/>
    </div>
  )
}