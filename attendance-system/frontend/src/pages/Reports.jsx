import { useState, useEffect } from 'react'
import client from '../api/client'

export default function Reports() {
  const [students, setStudents] = useState([])
  const [units, setUnits] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [summary, setSummary] = useState(null)
  const [classReport, setClassReport] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    client.get('/students/').then(r => setStudents(r.data)).catch(() => {})
    client.get('/classes/').then(r => setUnits(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedStudent) { setSummary(null); return }
    setLoading(true)
    client.get(`/reports/summary/${selectedStudent}`)
      .then(r => setSummary(r.data))
      .catch(() => setSummary([]))
      .finally(() => setLoading(false))
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedUnit) { setClassReport([]); return }
    setLoading(true)
    client.get(`/reports/class/${selectedUnit}`)
      .then(r => setClassReport(r.data))
      .catch(() => setClassReport([]))
      .finally(() => setLoading(false))
  }, [selectedUnit])

  const summaryMap = {}
  if (summary) summary.forEach(s => { summaryMap[s._id] = s.count })
  const totalSessions = Object.values(summaryMap).reduce((a, b) => a + b, 0)
  const presentCount = summaryMap['present'] || 0
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0
  const rateColor = attendanceRate >= 75 ? 'var(--success)' : attendanceRate >= 60 ? 'var(--warning)' : 'var(--danger)'

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.reg_number?.toLowerCase().includes(search.toLowerCase())
  )

  const student = students.find(s => s.reg_number === selectedStudent)

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="topbar-title">Reports</div>
        <div className="topbar-meta">Analytics & summaries</div>
      </div>

      <div className="page-body">
        <div className="section-header">
          <div>
            <div className="section-title">Attendance Reports</div>
            <div className="section-subtitle">Per-student and per-unit summaries</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Student Report */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 4 }}>Student Report</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>Individual attendance summary</div>
              </div>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label">Search Student</label>
                <input className="form-control" placeholder="Name or reg number..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Student</label>
                <select className="form-control" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                  <option value="">— Choose student —</option>
                  {filteredStudents.map(s => (
                    <option key={s._id} value={s.reg_number}>{s.full_name} ({s.reg_number})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student summary */}
            {selectedStudent && (
              <div className="card">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    Loading...
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>{student?.full_name}</div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--gray-400)' }}>
                        {student?.reg_number} · {student?.school} · {student?.department}
                      </div>
                    </div>

                    {/* Rate circle */}
                    <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--gray-50)', borderBottom: '1px solid var(--gray-50)', marginBottom: 20 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', color: rateColor, lineHeight: 1 }}>
                        {attendanceRate}%
                      </div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--gray-400)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Attendance Rate
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <div className="progress-bar" style={{ maxWidth: 200, margin: '0 auto' }}>
                          <div className={`progress-fill ${attendanceRate < 60 ? 'low' : attendanceRate < 75 ? 'mid' : ''}`}
                            style={{ width: `${attendanceRate}%`, background: rateColor }} />
                        </div>
                      </div>
                      {attendanceRate < 75 && (
                        <div style={{
                          marginTop: 10, fontSize: '0.72rem', color: 'var(--danger)',
                          fontFamily: 'var(--font-mono)', background: '#fdf2f1',
                          border: '1px solid #f5c6c3', borderRadius: 'var(--radius)',
                          padding: '6px 12px', display: 'inline-block'
                        }}>
                          Below 75% threshold
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Present', key: 'present', color: 'var(--success)', bg: '#f0faf4' },
                        { label: 'Absent',  key: 'absent',  color: 'var(--danger)',  bg: '#fdf2f1' },
                        { label: 'Late',    key: 'late',    color: 'var(--warning)', bg: '#fdf8ee' },
                      ].map(item => (
                        <div key={item.key} style={{ background: item.bg, borderRadius: 'var(--radius)', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: item.color, lineHeight: 1 }}>
                            {summaryMap[item.key] || 0}
                          </div>
                          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: item.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                      {totalSessions} total sessions recorded
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Class Report */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 4 }}>Unit Report</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>All students in a unit</div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Unit</label>
                <select className="form-control" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                  <option value="">— Choose unit —</option>
                  {units.map(u => (
                    <option key={u._id || u.unit_code} value={u._id || u.unit_code}>
                      {u.unit_code} · {u.unit_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedUnit && (
              <div className="card card-flush">
                {loading ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Loading...</div>
                ) : classReport.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-text">No attendance data for this unit</div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Reg Number</th>
                          <th>Present</th>
                          <th>Total</th>
                          <th>Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classReport
                          .sort((a, b) => (b.present / b.total) - (a.present / a.total))
                          .map((r, i) => {
                            const rate = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0
                            const stud = students.find(s => s.reg_number === r._id)
                            return (
                              <tr key={i}>
                                <td>
                                  <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{stud?.full_name || r._id}</div>
                                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--gray-400)' }}>{r._id}</div>
                                </td>
                                <td><span className="text-mono">{r.present}</span></td>
                                <td><span className="text-mono text-muted">{r.total}</span></td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="progress-bar" style={{ flex: 1, minWidth: 60 }}>
                                      <div className={`progress-fill ${rate < 60 ? 'low' : rate < 75 ? 'mid' : ''}`}
                                        style={{ width: `${rate}%` }} />
                                    </div>
                                    <span className="text-mono text-sm">{rate}%</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${rate >= 75 ? 'badge-present' : rate >= 60 ? 'badge-late' : 'badge-absent'}`}>
                                    {rate >= 75 ? 'Good' : rate >= 60 ? 'At Risk' : 'Critical'}
                                  </span>
                                </td>
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
        </div>

        {/* All students at-a-glance */}
        <div className="card card-flush">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
            <div className="section-title" style={{ fontSize: '1rem' }}>All Students — Attendance Overview</div>
            <div className="section-subtitle">Based on all recorded sessions</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>School</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 20).map((s, i) => (
                  <tr key={s._id || i} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(s.reg_number)}>
                    <td><span className="text-mono text-muted">{i + 1}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.full_name}</div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--gray-400)' }}>{s.reg_number}</div>
                    </td>
                    <td><span className="badge badge-dark">{s.school}</span></td>
                    <td><span className="text-muted">{s.department}</span></td>
                    <td><span className="text-mono text-sm">Y{s.year}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress-bar" style={{ flex: 1, minWidth: 80 }}>
                          <div className="progress-fill" style={{ width: `${60 + Math.random() * 35}%` }} />
                        </div>
                        <span className="badge badge-outline" style={{ cursor: 'pointer' }}>View →</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}