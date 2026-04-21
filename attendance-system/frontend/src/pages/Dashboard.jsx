import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

const DAY      = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
const todayISO = new Date().toISOString().split('T')[0]
const HOUR     = new Date().getHours()
const GREET    = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'

const SCHOOL_COLORS = {
  'Strathmore University':'#f0c060',
  'University of Nairobi':'#5cb87a',
  'KCA University':'#60a5fa',
  'JKUAT':'#e06060',
  'Kenyatta University':'#a78bfa',
  'Moi University':'#fb923c',
}
const schoolColor = name => SCHOOL_COLORS[name] || '#f0c060'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [courses,  setCourses]  = useState([])
  const [todayAtt, setTodayAtt] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          api.get('/students/'),
          api.get('/classes/'),
        ])
        setStudents(sRes.data)
        setCourses(cRes.data)
        if (cRes.data.length > 0) {
          try {
            const id  = cRes.data[0]._id || cRes.data[0].unit_code
            const aRes = await api.get(`/attendance/class/${id}/date/${todayISO}`)
            setTodayAtt(aRes.data)
          } catch {}
        }
      } catch {}
      finally { setLoading(false) }
    })()
  }, [])

  const present = todayAtt.filter(r => r.status === 'present').length
  const absent  = todayAtt.filter(r => r.status === 'absent').length
  const late    = todayAtt.filter(r => r.status === 'late').length
  const rate    = todayAtt.length ? Math.round((present / todayAtt.length) * 100) : 0
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'there'

  const bySchool = courses.reduce((a, c) => {
    const k = c.school || 'Other';(a[k] = a[k] || []).push(c); return a
  }, {})

  const SK = ({ w = '100%', h = 13, mb = 0, r = 6 }) => (
    <div className="sk" style={{ width:w, height:h, marginBottom:mb, borderRadius:r }} />
  )

  // ── quick-action card ──────────────────────────────────
  const QuickAction = ({ icon, label, desc, to }) => (
    <div
      onClick={() => navigate(to)}
      style={{ padding:'16px', background:'var(--bg3)', border:'1px solid var(--br)', borderRadius:'var(--r2)', cursor:'pointer', transition:'border-color 150ms, transform 150ms', display:'flex', alignItems:'flex-start', gap:12 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--br3)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--br)';  e.currentTarget.style.transform='none' }}
    >
      <div style={{ width:36, height:36, background:'var(--bg4)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight:700, fontSize:'.84rem', marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:'.72rem', color:'var(--tx3)', fontFamily:'var(--mono)' }}>{desc}</div>
      </div>
    </div>
  )

  return (
    <div className="page-in">
      <div className="topbar">
        <div className="tb-title">Dashboard</div>
        <div className="tb-meta">{DAY}</div>
        <div className="tb-pill">Sem 1 · 2024/25</div>
      </div>

      <div className="body">

        {/* ── HERO ── */}
        <div className="hero">
          <div>
            <div className="hero-greeting">{GREET}</div>
            <div className="hero-name">{firstName} <span>👋</span></div>
            <div className="hero-meta">{user?.school || 'AttendIQ'} · {user?.role || 'Lecturer'}</div>
          </div>
          <div style={{ display:'flex', gap:9 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/attendance')}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="2" width="11" height="9.5" rx="1.5"/>
                <path d="M4 1v2.5M9 1v2.5M1 6h11M4 9l1.5 1.5 3-3"/>
              </svg>
              Mark Attendance
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => navigate('/dashboard/students')}>
              + Add Student
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="stats-row">
          {[
            { label:'Total Students', val: students.length,  sub: `across ${Object.keys(bySchool).length} institution${Object.keys(bySchool).length!==1?'s':''}` },
            { label:'Active Courses',  val: courses.length,   sub: `${Object.keys(bySchool).length} school${Object.keys(bySchool).length!==1?'s':''}` },
            { label:'Present Today',   val: present,          sub: `of ${todayAtt.length} recorded` },
            { label:'Attendance Rate', val: `${rate}%`,       sub: rate >= 75 ? 'On track ✓' : rate === 0 ? 'No data yet' : 'Below 75% threshold', accent: true },
          ].map((s, i) => (
            <div key={i} className={`stat${s.accent ? ' accent' : ''}`}>
              <div className="stat-label">{s.label}</div>
              {loading
                ? <SK h={28} w={60} mb={8} />
                : <div className="stat-val">{s.val}</div>
              }
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:'.66rem', fontFamily:'var(--mono)', color:'var(--tx3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>Quick actions</div>
          <div className="g4">
            <QuickAction icon="✅" label="Mark Attendance"   desc="Open session & mark"  to="/dashboard/attendance" />
            <QuickAction icon="👤" label="Add Student"       desc="Register new student"  to="/dashboard/students" />
            <QuickAction icon="📚" label="Add Course"        desc="Create a new unit"     to="/dashboard/courses" />
            <QuickAction icon="📊" label="View Reports"      desc="Attendance analytics"  to="/dashboard/reports" />
          </div>
        </div>

        {/* ── MIDDLE ROW ── */}
        <div className="g2" style={{ marginBottom:18 }}>

          {/* Today's attendance breakdown */}
          <div className="card">
            <div className="sh" style={{ marginBottom:14 }}>
              <div>
                <div className="sh-title" style={{ fontSize:'.9rem' }}>Today's Attendance</div>
                <div className="sh-sub">{courses[0]?.lesson_name || 'First session'}</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/dashboard/attendance')}
              >Mark now →</button>
            </div>

            {loading ? [1,2,3].map(i => <SK key={i} h={11} mb={14} />) :
             todayAtt.length === 0 ? (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <div style={{ fontSize:'1.6rem', marginBottom:8 }}>🗓️</div>
                <div style={{ fontSize:'.78rem', color:'var(--tx3)' }}>No attendance marked today</div>
                <button className="btn btn-gold btn-sm" style={{ marginTop:12 }} onClick={() => navigate('/dashboard/attendance')}>
                  Start marking →
                </button>
              </div>
            ) : (
              <>
                {[['present',present,'var(--ok)'],['absent',absent,'var(--err)'],['late',late,'var(--warn)']].map(([k,v,col]) => (
                  <div key={k} style={{ marginBottom:13 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:'.72rem', color:'var(--tx3)', textTransform:'capitalize', fontFamily:'var(--mono)' }}>{k}</span>
                      <span style={{ fontSize:'.72rem', fontWeight:700, fontFamily:'var(--mono)', color:col }}>
                        {v} <span style={{ color:'var(--tx3)', fontWeight:400 }}>/ {todayAtt.length}</span>
                      </span>
                    </div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width:`${todayAtt.length?(v/todayAtt.length)*100:0}%`, background:col }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'.7rem', color:'var(--tx3)', fontFamily:'var(--mono)' }}>Overall rate</span>
                  <span style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-.04em', color: rate>=75?'var(--ok)':'var(--err)' }}>{rate}%</span>
                </div>
              </>
            )}
          </div>

          {/* Recent attendance records */}
          <div className="card card-flush">
            <div style={{ padding:'14px 18px 11px', borderBottom:'1px solid var(--br)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:'.88rem' }}>Recent Records</div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/reports')}>
                View all →
              </button>
            </div>
            <div style={{ overflowY:'auto', maxHeight:252 }}>
              {loading ? [1,2,3,4].map(i => (
                <div key={i} style={{ padding:'10px 18px', display:'flex', gap:10, alignItems:'center' }}>
                  <div className="sk" style={{ width:28, height:28, borderRadius:'50%' }} />
                  <SK w="55%" h={11} />
                </div>
              )) : todayAtt.length === 0 ? (
                <div className="empty"><div className="empty-text">No records today yet</div></div>
              ) : todayAtt.slice(0,12).map((r,i) => (
                <div key={i} style={{ padding:'9px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom: i<todayAtt.length-1?'1px solid var(--br)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.6rem', fontFamily:'var(--mono)', color:'var(--tx3)' }}>
                      {r.student_id?.slice(-2)}
                    </div>
                    <span style={{ fontSize:'.8rem', fontWeight:600 }}>{r.student_id}</span>
                  </div>
                  <span className={`badge b-${r.status}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── INSTITUTION BREAKDOWN ── */}
        {Object.keys(bySchool).length > 0 && (
          <div className="card" style={{ marginBottom:18 }}>
            <div className="sh">
              <div>
                <div className="sh-title" style={{ fontSize:'.88rem' }}>Institutions</div>
                <div className="sh-sub">Course & student distribution</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
              {Object.entries(bySchool).map(([school, list]) => {
                const stuCount = students.filter(s => s.school === school).length
                const col = schoolColor(school)
                return (
                  <div key={school}
                    style={{ padding:'14px', background:'var(--bg3)', borderRadius:'var(--r)', border:'1px solid var(--br)', transition:'border-color 140ms, transform 140ms', cursor:'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=col+'55'; e.currentTarget.style.transform='translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--br)'; e.currentTarget.style.transform='none' }}
                    onClick={() => navigate('/dashboard/courses')}
                  >
                    <div style={{ width:8, height:8, borderRadius:'50%', background:col, marginBottom:9 }} />
                    <div style={{ fontFamily:'var(--mono)', fontSize:'.66rem', color:'var(--tx3)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={school}>{school}</div>
                    <div style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-.04em', lineHeight:1, marginBottom:3 }}>{loading ? '—' : stuCount}</div>
                    <div style={{ fontSize:'.62rem', color:'var(--tx3)', fontFamily:'var(--mono)', marginBottom:9 }}>{list.length} course{list.length!==1?'s':''}</div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width:`${students.length?(stuCount/students.length)*100:0}%`, background:col }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── COURSES TABLE ── */}
        <div className="card card-flush">
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--br)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:'.88rem' }}>My Courses</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/courses')}>Manage →</button>
          </div>
          {loading ? (
            <div style={{ padding:'20px 18px' }}>
              {[1,2,3].map(i => <SK key={i} h={13} mb={12} />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize:'1.5rem', marginBottom:10 }}>📚</div>
              <div className="empty-text" style={{ marginBottom:12 }}>No courses yet</div>
              <button className="btn btn-gold btn-sm" onClick={() => navigate('/dashboard/courses')}>Add your first course →</button>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead><tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Institution</th>
                  <th>Schedule</th>
                  <th>Venue</th>
                  <th>Credits</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {courses.slice(0,6).map((c,i) => (
                    <tr key={i} style={{ cursor:'pointer' }} onClick={() => navigate('/dashboard/attendance')}>
                      <td><span className="badge b-gold">{c.unit_code}</span></td>
                      <td style={{ fontWeight:600 }}>{c.lesson_name || c.unit_name}</td>
                      <td><span className="muted mono sm">{c.school}</span></td>
                      <td><span className="muted sm">{c.schedule || '—'}</span></td>
                      <td><span className="muted sm">{c.venue || '—'}</span></td>
                      <td><span className="badge b-muted">{c.credit_hours || '—'} cr</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate('/dashboard/attendance') }}>
                          Mark →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}