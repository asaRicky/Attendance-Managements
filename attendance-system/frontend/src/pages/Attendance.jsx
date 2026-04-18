import { useState, useEffect } from 'react'
import client from '../api/client'
import { useToast, ToastContainer } from '../hooks/UseToast'
import { useAuthStore } from '../store/authStore'

export default function Attendance() {
  const { user } = useAuthStore()
  const [classes,   setClasses]   = useState([])
  const [students,  setStudents]  = useState([])   // students for the selected class
  const [selectedClass, setSelectedClass] = useState('')
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0])
  const [records,   setRecords]   = useState({})   // { student_id: status }
  const [loading,   setLoading]   = useState(false)
  const [submitting,setSubmitting]= useState(false)
  const { toasts, addToast } = useToast()

  // Load lecturer's classes on mount
  useEffect(() => {
    client.get('/classes/').then(r => setClasses(r.data)).catch(() => {})
  }, [])

  // When class changes, fetch its students
  useEffect(() => {
    if (!selectedClass) { setStudents([]); setRecords({}); return }
    client.get(`/students/?class_id=${selectedClass}`)
      .then(r => setStudents(r.data))
      .catch(() => setStudents([]))
  }, [selectedClass])

  // When class OR date changes, fetch existing attendance
  useEffect(() => {
    if (!selectedClass || !date) return
    setLoading(true)
    client.get(`/attendance/class/${selectedClass}/date/${date}`)
      .then(r => {
        const map = {}
        r.data.forEach(rec => { map[rec.student_id] = rec.status })
        setRecords(map)
      })
      .catch(() => setRecords({}))
      .finally(() => setLoading(false))
  }, [selectedClass, date])

  const cls = classes.find(c => c._id === selectedClass)

  const setStatus = (studentId, status) =>
    setRecords(prev => ({ ...prev, [studentId]: prev[studentId] === status ? undefined : status }))

  const markAll = (status) => {
    const map = {}
    students.forEach(s => { map[s.student_id] = status })
    setRecords(map)
  }

  const stats = {
    present:  Object.values(records).filter(v => v === 'present').length,
    absent:   Object.values(records).filter(v => v === 'absent').length,
    late:     Object.values(records).filter(v => v === 'late').length,
    unmarked: students.filter(s => !records[s.student_id]).length,
  }

  const handleSubmit = async () => {
    const toSubmit = students
      .filter(s => records[s.student_id])
      .map(s => ({
        student_id: s.student_id,
        class_id:   selectedClass,
        date,
        status:     records[s.student_id],
        marked_by:  user?.username || 'unknown',
      }))

    if (toSubmit.length === 0) { addToast('Mark at least one student', 'error'); return }

    setSubmitting(true)
    try {
      await client.post('/attendance/bulk', { class_id: selectedClass, date, records: toSubmit })
      addToast(`Attendance saved — ${toSubmit.length} record${toSubmit.length !== 1 ? 's' : ''}`)
    } catch (e) {
      addToast(e.response?.data?.detail || 'Failed to save', 'error')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="topbar-title">Attendance</div>
        <div className="topbar-meta">
          {selectedClass && students.length > 0 ? `${students.length} students` : 'Select a class'}
        </div>
      </div>

      <div className="page-body">
        <div className="section-header">
          <div>
            <div className="section-title">Mark Attendance</div>
            <div className="section-subtitle">Select a class and date to begin</div>
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
              <label className="form-label">Class</label>
              <select
                className="form-control"
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setRecords({}) }}
              >
                <option value="">— Select a class —</option>
                {/* Group options by school */}
                {Object.entries(
                  classes.reduce((acc, c) => {
                    const key = c.school || 'Other'
                    if (!acc[key]) acc[key] = []
                    acc[key].push(c)
                    return acc
                  }, {})
                ).map(([school, schoolClasses]) => (
                  <optgroup key={school} label={school}>
                    {schoolClasses.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.unit_code} · {c.lesson_name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input
                className="form-control"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            {selectedClass && students.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => markAll('present')}>All Present</button>
                <button className="btn btn-outline btn-sm" onClick={() => markAll('absent')}>All Absent</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setRecords({})}>Clear</button>
              </div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        {selectedClass && students.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Present',  val: stats.present,  color: 'var(--success)', bg: '#f0faf4' },
              { label: 'Absent',   val: stats.absent,   color: 'var(--danger)',  bg: '#fdf2f1' },
              { label: 'Late',     val: stats.late,     color: 'var(--warning)', bg: '#fdf8ee' },
              { label: 'Unmarked', val: stats.unmarked, color: 'var(--gray-400)', bg: 'var(--gray-50)' },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-lg)',
                background: s.bg, border: '1px solid transparent',
              }}>
                <div style={{
                  fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                  color: s.color, letterSpacing: '0.12em',
                  textTransform: 'uppercase', marginBottom: 4,
                }}>{s.label}</div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.8rem',
                  color: s.color, lineHeight: 1,
                }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Class info banner */}
        {cls && (
          <div style={{
            background: 'var(--black)', color: 'var(--white)',
            borderRadius: 'var(--radius-lg)', padding: '14px 20px',
            marginBottom: 16, display: 'flex', alignItems: 'center',
            gap: 20, flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--gray-600)', marginRight: 8 }}>
                {cls.unit_code}
              </span>
              <span style={{ fontWeight: 500 }}>{cls.lesson_name}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
              {cls.school} · {cls.department}
            </div>
            {cls.schedule && (
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                🕐 {cls.schedule}
              </div>
            )}
            {cls.venue && (
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                📍 {cls.venue}
              </div>
            )}
          </div>
        )}

        {/* Student list */}
        {!selectedClass ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                  <rect x="4" y="8" width="32" height="28" rx="3"/>
                  <path d="M12 4v8M28 4v8M4 20h32"/>
                  <path d="M14 28l4 4 8-8"/>
                </svg>
              </div>
              <div className="empty-state-text">Select a class above to start marking attendance</div>
            </div>
          </div>
        ) : loading ? (
          <div className="att-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="att-row">
                <div className="skeleton" style={{ height: 14, width: 24 }} />
                <div>
                  <div className="skeleton" style={{ height: 13, width: '60%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '35%' }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3].map(j => <div key={j} className="skeleton" style={{ height: 28, width: 64, borderRadius: 2 }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-text">
                No students enrolled in this class yet.{' '}
                <a href="/students" style={{ color: 'var(--black)', fontWeight: 600 }}>Add students →</a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="att-grid" style={{ marginBottom: 20 }}>
              {students.map((s, i) => {
                const status = records[s.student_id]
                return (
                  <div
                    key={s._id || s.student_id}
                    className="att-row"
                    style={{
                      background:
                        status === 'present' ? '#fafffe' :
                        status === 'absent'  ? '#fffafa' :
                        status === 'late'    ? '#fffdf5' : 'var(--white)',
                    }}
                  >
                    <div className="att-num">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <div className="att-name">{s.full_name}</div>
                      <div className="att-reg">{s.student_id}</div>
                    </div>
                    <div className="att-toggle">
                      {['present', 'absent', 'late'].map(st => (
                        <button
                          key={st}
                          className={`att-btn ${status === st ? `selected-${st}` : ''}`}
                          onClick={() => setStatus(s.student_id, st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sticky submit */}
            <div style={{
              position: 'sticky', bottom: 24,
              background: 'var(--white)', border: '1px solid var(--gray-100)',
              borderRadius: 'var(--radius-lg)', padding: '16px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,.08)',
            }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--gray-600)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {Object.keys(records).filter(k => records[k]).length}
                </span>{' '}of{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{students.length}</span> students marked
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Attendance →'}
              </button>
            </div>
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}