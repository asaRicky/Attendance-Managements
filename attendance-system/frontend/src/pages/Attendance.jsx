import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useToast, Toasts } from '../hooks/useToast'
import { useAuthStore } from '../store/authStore'

const todayISO = new Date().toISOString().split('T')[0]

// ── Tiny QR renderer using qr-code-generator algorithm ────────
// We use a canvas-based approach with the qrcode library loaded via CDN
function QRDisplay({ value, size = 200 }) {
  const ref = useRef()
  useEffect(() => {
    if (!value || !ref.current) return
    // dynamically load qrcode library
    const script = document.getElementById('qrlib')
    const render = () => {
      if (window.QRCode) {
        ref.current.innerHTML = ''
        new window.QRCode(ref.current, {
          text: value, width: size, height: size,
          colorDark: '#0c0c0e', colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.H,
        })
      }
    }
    if (window.QRCode) { render() } else {
      if (!script) {
        const s = document.createElement('script')
        s.id = 'qrlib'
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
        s.onload = render
        document.head.appendChild(s)
      } else { script.addEventListener('load', render) }
    }
  }, [value, size])
  return <div ref={ref} />
}

export default function Attendance() {
  const { user } = useAuthStore()
  const [courses,   setCourses]   = useState([])
  const [students,  setStudents]  = useState([])
  const [selCourse, setSelCourse] = useState('')
  const [date,      setDate]      = useState(todayISO)
  const [records,   setRecords]   = useState({})
  const [loading,   setLoading]   = useState(false)
  const [submitting,setSubmitting]= useState(false)
  const [qrModal,   setQrModal]   = useState(false)
  const [qrValue,   setQrValue]   = useState('')
  const { toasts, toast } = useToast()

  useEffect(() => { api.get('/classes/').then(r => setCourses(r.data)).catch(() => {}) }, [])

  useEffect(() => {
    if (!selCourse) { setStudents([]); setRecords({}); return }
    const course = courses.find(c => (c._id || c.unit_code) === selCourse)
    if (!course) return
    api.get('/students/')
      .then(r => setStudents(r.data.filter(s => s.school === course.school || s.department === course.department)))
      .catch(() => {})
  }, [selCourse, courses])

  useEffect(() => {
    if (!selCourse || !date) return
    setLoading(true)
    api.get(`/attendance/class/${selCourse}/date/${date}`)
      .then(r => {
        const map = {}
        r.data.forEach(rec => { map[rec.student_id] = rec.status })
        setRecords(map)
      })
      .catch(() => setRecords({}))
      .finally(() => setLoading(false))
  }, [selCourse, date])

  const course = courses.find(c => (c._id || c.unit_code) === selCourse)

  const setStatus = (sid, status) => setRecords(p => ({ ...p, [sid]: p[sid] === status ? undefined : status }))
  const markAll = st => { const m = {}; students.forEach(s => { m[s.student_id || s.reg_number] = st }); setRecords(m) }

  const stats = {
    present:  Object.values(records).filter(v => v === 'present').length,
    absent:   Object.values(records).filter(v => v === 'absent').length,
    late:     Object.values(records).filter(v => v === 'late').length,
    unmarked: students.filter(s => !records[s.student_id || s.reg_number]).length,
  }

  const handleSubmit = async () => {
    const toSubmit = students
      .filter(s => records[s.student_id || s.reg_number])
      .map(s => ({
        student_id: s.student_id || s.reg_number,
        unit_id: selCourse, class_id: selCourse,
        department: s.department, school: s.school,
        date, status: records[s.student_id || s.reg_number],
        marked_by: user?.username || 'lecturer',
        academic_year: '2024/2025', semester: 1,
      }))
    if (!toSubmit.length) { toast('Mark at least one student','err'); return }
    setSubmitting(true)
    try {
      await api.post('/attendance/bulk', { class_id: selCourse, date, records: toSubmit })
      toast(`Saved — ${toSubmit.length} record${toSubmit.length!==1?'s':''}`)
    } catch(e) { toast(e.response?.data?.detail || 'Failed to save','err') }
    finally { setSubmitting(false) }
  }

  const openQR = () => {
    if (!selCourse || !date) { toast('Select a course and date first','err'); return }
    // QR value encodes course + date — student scans and it marks them present
    const payload = JSON.stringify({ course_id: selCourse, date, course_code: course?.unit_code })
    setQrValue(payload)
    setQrModal(true)
  }

  const marked = Object.keys(records).filter(k => records[k]).length

  return (
    <div className="page-in">
      <div className="topbar">
        <div className="tb-title">Attendance</div>
        <div className="tb-meta">{selCourse && students.length ? `${students.length} students` : 'Select a course'}</div>
      </div>

      <div className="body">
        <div className="sh">
          <div>
            <div className="sh-title">Mark Attendance</div>
            <div className="sh-sub">Select course and date, then mark each student</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={openQR} disabled={!selCourse}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/>
                <rect x="1" y="8" width="5" height="5" rx="1"/>
                <path d="M8 8h1M10 8h3M8 10v1M10 11h1M12 11v2M10 13h1M8 12v1"/>
              </svg>
              QR Attendance
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="card mb-5">
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div className="fg" style={{ flex:2, minWidth:200, marginBottom:0 }}>
              <label className="fl">Course</label>
              <select className="fc" value={selCourse} onChange={e => { setSelCourse(e.target.value); setRecords({}) }}>
                <option value="">— Select course —</option>
                {Object.entries(courses.reduce((a,c) => { const k=c.school||'Other'; (a[k]=a[k]||[]).push(c); return a },{})).map(([school,list]) => (
                  <optgroup key={school} label={school}>
                    {list.map(c => <option key={c._id||c.unit_code} value={c._id||c.unit_code}>{c.unit_code} · {c.lesson_name||c.unit_name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="fg" style={{ flex:1, minWidth:160, marginBottom:0 }}>
              <label className="fl">Date</label>
              <input className="fc" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {selCourse && students.length > 0 && (
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => markAll('present')}>All Present</button>
                <button className="btn btn-ghost btn-sm" onClick={() => markAll('absent')}>All Absent</button>
                <button className="btn btn-outline btn-sm" onClick={() => setRecords({})}>Clear</button>
              </div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        {selCourse && students.length > 0 && (
          <div className="g4 mb-5">
            {[
              { label:'Present',  val:stats.present,  color:'var(--success)', bg:'var(--success-bg)' },
              { label:'Absent',   val:stats.absent,   color:'var(--danger)',  bg:'var(--danger-bg)' },
              { label:'Late',     val:stats.late,     color:'var(--warning)', bg:'var(--warning-bg)' },
              { label:'Unmarked', val:stats.unmarked, color:'var(--muted)',   bg:'var(--bg3)' },
            ].map(s => (
              <div key={s.label} style={{ padding:'14px 16px', borderRadius:'var(--r2)', background:s.bg, border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:'0.6rem', fontFamily:'var(--mono)', color:s.color, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:'1.8rem', fontWeight:800, letterSpacing:'-0.04em', color:s.color, lineHeight:1 }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Course banner */}
        {course && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:'12px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <span className="badge b-lime">{course.unit_code}</span>
            <span style={{ fontWeight:600 }}>{course.lesson_name || course.unit_name}</span>
            <span className="muted mono sm">{course.school} · {course.department}</span>
            {course.schedule && <span className="muted sm">🕐 {course.schedule}</span>}
            {course.venue    && <span className="muted sm">📍 {course.venue}</span>}
          </div>
        )}

        {/* Student list */}
        {!selCourse ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="6" y="10" width="40" height="34" rx="4"/>
                  <path d="M16 6v8M36 6v8M6 26h40"/>
                  <path d="M18 35l5 5 11-11"/>
                </svg>
              </div>
              <div className="empty-text">Select a course above to begin marking</div>
            </div>
          </div>
        ) : loading ? (
          <div className="att-list">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="att-row">
                <div className="sk" style={{ height:14, width:24 }} />
                <div><div className="sk" style={{ height:13, width:'55%', marginBottom:6 }} /><div className="sk" style={{ height:11, width:'35%' }} /></div>
                <div style={{ display:'flex', gap:5 }}>{[1,2,3].map(j=><div key={j} className="sk" style={{ height:26, width:56, borderRadius:7 }} />)}</div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-text">No students found for this course's school. <a href="/students" style={{ color:'var(--lime)' }}>Add students →</a></div>
            </div>
          </div>
        ) : (
          <>
            <div className="att-list mb-5">
              {students.map((s,i) => {
                const sid = s.student_id || s.reg_number
                const st = records[sid]
                return (
                  <div key={s._id||i} className="att-row" style={{ background: st==='present'?'rgba(52,211,153,0.04)':st==='absent'?'rgba(255,92,92,0.04)':st==='late'?'rgba(245,158,11,0.04)':'var(--bg2)' }}>
                    <div className="att-num">{String(i+1).padStart(2,'0')}</div>
                    <div>
                      <div className="att-name">{s.full_name}</div>
                      <div className="att-id">{sid} · {s.department}</div>
                    </div>
                    <div className="att-btns">
                      <button className={`att-btn${st==='present'?' sp':''}`} onClick={() => setStatus(sid,'present')}>P</button>
                      <button className={`att-btn${st==='absent' ?' sa':''}`} onClick={() => setStatus(sid,'absent')}>A</button>
                      <button className={`att-btn${st==='late'   ?' sl':''}`} onClick={() => setStatus(sid,'late')}>L</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sticky save bar */}
            <div style={{ position:'sticky', bottom:20, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 8px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize:'0.82rem', color:'var(--muted)' }}>
                <span className="mono" style={{ color:'var(--white)' }}>{marked}</span> of <span className="mono">{students.length}</span> students marked
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={openQR}>Show QR</button>
                <button className="btn btn-lime" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Attendance →'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setQrModal(false)}>
          <div className="modal" style={{ maxWidth:400, textAlign:'center' }}>
            <div className="modal-h" style={{ justifyContent:'space-between' }}>
              <span className="modal-title">QR Attendance</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setQrModal(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 2l10 10M12 2L2 12"/></svg>
              </button>
            </div>
            <div className="modal-b" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'12px', marginBottom:4 }}>
                <div className="qr-container">
                  <QRDisplay value={qrValue} size={200} />
                </div>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>{course?.lesson_name || course?.unit_name}</div>
                <div style={{ fontSize:'0.72rem', fontFamily:'var(--mono)', color:'var(--muted)' }}>{course?.unit_code} · {date}</div>
              </div>
              <div style={{ background:'var(--lime-glow)', border:'1px solid rgba(200,240,76,0.25)', borderRadius:'var(--r)', padding:'10px 16px', fontSize:'0.78rem', color:'var(--lime)', lineHeight:1.6 }}>
                Students scan this QR to mark themselves present.<br/>
                QR is unique to <strong>{date}</strong>.
              </div>
            </div>
            <div className="modal-f" style={{ justifyContent:'center' }}>
              <button className="btn btn-lime" onClick={() => {
                const c = document.querySelector('.qr-container canvas') || document.querySelector('.qr-container img')
                if (c) {
                  const a = document.createElement('a')
                  a.href = c.tagName==='CANVAS' ? c.toDataURL() : c.src
                  a.download = `qr-${course?.unit_code}-${date}.png`; a.click()
                  toast('QR downloaded')
                }
              }}>Download QR</button>
            </div>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}