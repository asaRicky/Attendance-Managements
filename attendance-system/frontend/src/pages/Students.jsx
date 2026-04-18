import { useState, useEffect } from 'react'
import client from '../api/client'
import { useToast, ToastContainer } from '../hooks/UseToast'

const SCHOOLS = ['SCES', 'SBS', 'SIMS', 'SLS', 'SHC', 'SPH', 'SIBS', 'SENL']
const DEPTS = {
  SCES: ['CS', 'IT', 'EE', 'SE'],
  SBS:  ['BBA', 'MBA', 'ACC'],
  SIMS: ['MIS', 'MTH', 'ACT'],
  SLS:  ['LLB', 'LLM'],
  SHC:  ['COM', 'DEV'],
  SPH:  ['PH'],
  SIBS: ['BIB'],
  SENL: ['ENV'],
}

const emptyForm = { full_name: '', reg_number: '', school: 'SCES', department: 'CS', year: 1, semester: 1, email: '', phone: '', gender: 'Male' }

export default function Students() {
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const { toasts, addToast } = useToast()

  useEffect(() => { fetchStudents() }, [])

  useEffect(() => {
    let data = students
    if (search) data = data.filter(s =>
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.reg_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    )
    if (filterSchool) data = data.filter(s => s.school === filterSchool)
    setFiltered(data)
  }, [students, search, filterSchool])

  async function fetchStudents() {
    setLoading(true)
    try {
      const res = await client.get('/students/')
      setStudents(res.data)
      setFiltered(res.data)
    } catch { addToast('Failed to load students', 'error') }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await client.post('/students/', form)
      addToast(`${form.full_name} added successfully`)
      setShowModal(false)
      setForm(emptyForm)
      fetchStudents()
    } catch (e) { addToast(e.response?.data?.detail || 'Failed to add student', 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    try {
      await client.delete(`/students/${id}`)
      addToast('Student removed')
      setShowDeleteModal(null)
      fetchStudents()
    } catch { addToast('Failed to delete student', 'error') }
  }

  const depts = DEPTS[form.school] || []

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="topbar-title">Students</div>
        <div className="topbar-meta">{filtered.length} records</div>
      </div>

      <div className="page-body">
        <div className="section-header">
          <div>
            <div className="section-title">Student Registry</div>
            <div className="section-subtitle">All enrolled students across schools</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 1v12M1 7h12"/>
            </svg>
            Add Student
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: '1', minWidth: '200px' }}>
            <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/>
            </svg>
            <input
              className="form-control"
              placeholder="Search by name, reg number or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 160 }} value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
            <option value="">All Schools</option>
            {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card card-flush">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Reg Number</th>
                  <th>School</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 12, width: j === 0 ? 20 : j === 8 ? 60 : '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9">
                    <div className="empty-state">
                      <div className="empty-state-icon">○</div>
                      <div className="empty-state-text">No students found</div>
                    </div>
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s._id || i}>
                    <td><span className="text-mono text-muted">{i + 1}</span></td>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td><span className="text-mono text-sm">{s.reg_number}</span></td>
                    <td><span className="badge badge-dark">{s.school}</span></td>
                    <td><span className="text-muted">{s.department}</span></td>
                    <td><span className="text-mono text-sm">Y{s.year} S{s.semester}</span></td>
                    <td><span className="text-muted truncate" style={{ maxWidth: 160, display: 'block' }}>{s.email}</span></td>
                    <td><span className="badge badge-outline">{s.gender}</span></td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setShowDeleteModal(s)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Student</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" placeholder="e.g. Alice Wanjiku" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number</label>
                  <input className="form-control" placeholder="e.g. 104298/2024" value={form.reg_number} onChange={e => setForm(f => ({ ...f, reg_number: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">School</label>
                  <select className="form-control" value={form.school}
                    onChange={e => setForm(f => ({ ...f, school: e.target.value, department: DEPTS[e.target.value]?.[0] || '' }))}>
                    {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Year of Study</label>
                  <select className="form-control" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-control" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}>
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" placeholder="reg@strathmore.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="07XXXXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.full_name || !form.reg_number}>
                {saving ? 'Saving...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowDeleteModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">Confirm Removal</div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                Are you sure you want to remove <strong>{showDeleteModal.full_name}</strong> ({showDeleteModal.reg_number})?
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteModal._id)}>Remove Student</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}