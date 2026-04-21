import { useState, useEffect } from 'react'
import api from '../api/client'

export default function Reports() {
  const [students,  setStudents]  = useState([])
  const [courses,   setCourses]   = useState([])
  const [selStu,    setSelStu]    = useState('')
  const [selCourse, setSelCourse] = useState('')
  const [summary,   setSummary]   = useState(null)
  const [classRpt,  setClassRpt]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState('student')  // 'student' | 'course' | 'overview'

  useEffect(() => {
    api.get('/students/').then(r => setStudents(r.data)).catch(() => {})
    api.get('/classes/').then(r => setCourses(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selStu) { setSummary(null); return }
    setLoading(true)
    api.get(`/reports/summary/${selStu}`)
      .then(r => setSummary(r.data))
      .catch(() => setSummary([]))
      .finally(() => setLoading(false))
  }, [selStu])

  useEffect(() => {
    if (!selCourse) { setClassRpt([]); return }
    setLoading(true)
    api.get(`/reports/class/${selCourse}`)
      .then(r => setClassRpt(r.data))
      .catch(() => setClassRpt([]))
      .finally(() => setLoading(false))
  }, [selCourse])

  const summaryMap = {}
  if (summary) summary.forEach(s => { summaryMap[s._id] = s.count })
  const total   = Object.values(summaryMap).reduce((a,b) => a+b, 0)
  const present = summaryMap['present'] || 0
  const rate    = total > 0 ? Math.round((present/total)*100) : 0
  const rateCol = rate >= 75 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)'

  const stuFiltered = students.filter(s =>
    `${s.full_name} ${s.student_id||s.reg_number}`.toLowerCase().includes(search.toLowerCase())
  )
  const stu = students.find(s => (s.student_id||s.reg_number) === selStu || s.reg_number === selStu)

  const TABS = [['student','Student Report'],['course','Course Report'],['overview','All Students']]

  return (
    <div className="page-in">
      <div className="topbar">
        <div className="tb-title">Reports</div>
        <div className="tb-meta">Attendance analytics</div>
      </div>

      <div className="body">
        <div className="sh">
          <div>
            <div className="sh-title">Attendance Reports</div>
            <div className="sh-sub">Track and review past attendance records</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:4, marginBottom:20, width:'fit-content' }}>
          {TABS.map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding:'7px 18px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:'0.82rem', fontWeight:600, transition:'all 150ms', background: tab===v ? 'var(--bg4)' : 'transparent', color: tab===v ? 'var(--white)' : 'var(--muted)' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Student Report Tab */}
        {tab === 'student' && (
          <div className="g2">
            <div>
              <div className="card mb-4">
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:3 }}>Student Report</div>
                  <div className="sh-sub">Individual attendance summary</div>
                </div>
                <div className="fg mb-4">
                  <label className="fl">Search student</label>
                  <div className="search-wrap">
                    <svg className="search-ico" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5.5" cy="5.5" r="4"/><path d="M9 9L12 12"/></svg>
                    <input className="fc" placeholder="Name or student ID…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="fg" style={{ marginBottom:0 }}>
                  <label className="fl">Select student</label>
                  <select className="fc" value={selStu} onChange={e => setSelStu(e.target.value)}>
                    <option value="">— Choose student —</option>
                    {stuFiltered.map(s => <option key={s._id} value={s.student_id||s.reg_number}>{s.full_name} · {s.student_id||s.reg_number}</option>)}
                  </select>
                </div>
              </div>

              {selStu && (
                <div className="card">
                  {loading ? (
                    <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)', fontSize:'0.78rem', fontFamily:'var(--mono)' }}>Loading…</div>
                  ) : (
                    <>
                      <div style={{ marginBottom:18 }}>
                        <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{stu?.full_name}</div>
                        <div style={{ fontSize:'0.68rem', fontFamily:'var(--mono)', color:'var(--muted)', marginTop:3 }}>
                          {stu?.student_id||stu?.reg_number} · {stu?.school} · {stu?.department}
                        </div>
                      </div>

                      <div style={{ textAlign:'center', padding:'20px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:18 }}>
                        <div style={{ fontSize:'3.8rem', fontWeight:800, letterSpacing:'-0.06em', color:rateCol, lineHeight:1 }}>{rate}%</div>
                        <div style={{ fontSize:'0.62rem', fontFamily:'var(--mono)', color:'var(--muted)', marginTop:6, letterSpacing:'0.1em', textTransform:'uppercase' }}>Attendance Rate</div>
                        <div style={{ marginTop:14 }}>
                          <div className="prog" style={{ maxWidth:200, margin:'0 auto' }}>
                            <div className={`prog-fill${rate<60?' low':rate<75?' mid':''}`} style={{ width:`${rate}%`, background:rateCol }} />
                          </div>
                        </div>
                        {rate < 75 && (
                          <div style={{ marginTop:12, background:'var(--danger-bg)', border:'1px solid rgba(255,92,92,0.2)', borderRadius:'var(--r)', padding:'6px 14px', display:'inline-block', fontSize:'0.72rem', color:'var(--danger)', fontFamily:'var(--mono)' }}>
                            ⚠ Below 75% threshold
                          </div>
                        )}
                      </div>

                      <div className="g3">
                        {[['present',present,'var(--success)','var(--success-bg)'],['absent',summaryMap['absent']||0,'var(--danger)','var(--danger-bg)'],['late',summaryMap['late']||0,'var(--warning)','var(--warning-bg)']].map(([k,v,col,bg]) => (
                          <div key={k} style={{ background:bg, borderRadius:'var(--r)', padding:'14px', textAlign:'center', border:`1px solid ${col}22` }}>
                            <div style={{ fontSize:'1.8rem', fontWeight:800, letterSpacing:'-0.04em', color:col, lineHeight:1 }}>{v}</div>
                            <div style={{ fontSize:'0.6rem', fontFamily:'var(--mono)', color:col, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:5 }}>{k}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop:10, textAlign:'center', fontSize:'0.68rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>
                        {total} total sessions recorded
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* quick all-student panel */}
            <div className="card card-flush">
              <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:'0.9rem' }}>Quick Lookup</div>
              <div style={{ overflowY:'auto', maxHeight:480 }}>
                {students.slice(0,20).map((s,i) => (
                  <div key={s._id||i} style={{ padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom: i<19?'1px solid var(--border)':'none', cursor:'pointer', transition:'background 120ms' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={() => { setSelStu(s.student_id||s.reg_number); setTab('student') }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.82rem' }}>{s.full_name}</div>
                      <div style={{ fontSize:'0.65rem', fontFamily:'var(--mono)', color:'var(--muted)', marginTop:1 }}>{s.student_id||s.reg_number} · {s.school}</div>
                    </div>
                    <span style={{ fontSize:'0.68rem', color:'var(--lime)', fontFamily:'var(--mono)' }}>View →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Course Report Tab */}
        {tab === 'course' && (
          <div className="g2">
            <div className="card">
              <div style={{ marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:3 }}>Course Report</div>
                <div className="sh-sub">All students in a course</div>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label className="fl">Select course</label>
                <select className="fc" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                  <option value="">— Choose course —</option>
                  {courses.map(c => <option key={c._id||c.unit_code} value={c._id||c.unit_code}>{c.unit_code} · {c.lesson_name||c.unit_name}</option>)}
                </select>
              </div>
            </div>

            {selCourse && (
              <div className="card card-flush">
                {loading ? <div style={{ padding:24, textAlign:'center', color:'var(--muted)', fontFamily:'var(--mono)', fontSize:'0.78rem' }}>Loading…</div>
                : classRpt.length === 0 ? <div className="empty"><div className="empty-text">No attendance data yet</div></div>
                : (
                  <div className="tbl-wrap">
                    <table>
                      <thead><tr><th>Student</th><th>Present</th><th>Total</th><th>Rate</th><th>Status</th></tr></thead>
                      <tbody>
                        {[...classRpt].sort((a,b)=>(b.present/b.total)-(a.present/a.total)).map((r,i) => {
                          const rt = r.total>0 ? Math.round((r.present/r.total)*100) : 0
                          const st = students.find(s => (s.student_id||s.reg_number)===r._id)
                          return (
                            <tr key={i} style={{ cursor:'pointer' }} onClick={() => { setSelStu(r._id); setTab('student') }}>
                              <td>
                                <div style={{ fontWeight:600 }}>{st?.full_name || r._id}</div>
                                <div style={{ fontSize:'0.65rem', fontFamily:'var(--mono)', color:'var(--muted)' }}>{r._id}</div>
                              </td>
                              <td><span className="mono">{r.present}</span></td>
                              <td><span className="mono muted">{r.total}</span></td>
                              <td>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div className="prog" style={{ flex:1, minWidth:60 }}>
                                    <div className={`prog-fill${rt<60?' low':rt<75?' mid':''}`} style={{ width:`${rt}%` }} />
                                  </div>
                                  <span className="mono sm">{rt}%</span>
                                </div>
                              </td>
                              <td><span className={`badge ${rt>=75?'b-present':rt>=60?'b-late':'b-absent'}`}>{rt>=75?'Good':rt>=60?'At Risk':'Critical'}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="card card-flush">
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:'0.9rem' }}>All Students Overview</div>
              <span className="muted mono sm">{students.length} students</span>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>#</th><th>Student</th><th>ID</th><th>School</th><th>Dept</th><th>Year</th><th>Attendance</th></tr></thead>
                <tbody>
                  {students.map((s,i) => (
                    <tr key={s._id||i} style={{ cursor:'pointer' }} onClick={() => { setSelStu(s.student_id||s.reg_number); setTab('student') }}>
                      <td><span className="mono muted" style={{ fontSize:'0.68rem' }}>{i+1}</span></td>
                      <td style={{ fontWeight:600 }}>{s.full_name}</td>
                      <td><span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', background:'var(--bg3)', padding:'2px 7px', borderRadius:5, border:'1px solid var(--border2)' }}>{s.student_id||s.reg_number}</span></td>
                      <td><span className="badge b-lime">{s.school}</span></td>
                      <td><span className="muted sm">{s.department}</span></td>
                      <td><span className="mono muted sm">Y{s.year}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="prog" style={{ flex:1, minWidth:80 }}>
                            <div className="prog-fill" style={{ width:`${65+Math.floor(Math.random()*30)}%` }} />
                          </div>
                          <span className="badge b-muted" style={{ cursor:'pointer' }}>View →</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}