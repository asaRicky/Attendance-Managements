import { useState, useEffect } from 'react'
import api from '../api/client'
import { useToast, Toasts } from '../hooks/useToast'

const SCHOOLS = ['SCES','SBS','SIMS','SLS','SHC','SPH','SIBS','SENL']
const DEPTS   = { SCES:['CS','IT','EE','SE'], SBS:['BBA','MBA','ACC'], SIMS:['MIS','MTH','ACT'], SLS:['LLB','LLM'], SHC:['COM','DEV'], SPH:['PH'], SIBS:['BIB'], SENL:['ENV'] }
const EMPTY   = { full_name:'', student_id:'', school:'SCES', department:'CS', year:1, semester:1, email:'', phone:'', gender:'Male' }

function genID() { return String(Math.floor(100000 + Math.random() * 900000)) }

export default function Students() {
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [fSchool, setFSchool]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)  // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const { toasts, toast }       = useToast()

  useEffect(() => { load() }, [])
  useEffect(() => {
    let d = students
    if (search)  d = d.filter(s => `${s.full_name} ${s.student_id} ${s.reg_number} ${s.email}`.toLowerCase().includes(search.toLowerCase()))
    if (fSchool) d = d.filter(s => s.school === fSchool)
    setFiltered(d)
  }, [students, search, fSchool])

  async function load() {
    setLoading(true)
    try { const r = await api.get('/students/'); setStudents(r.data); setFiltered(r.data) }
    catch { toast('Failed to load students','err') }
    finally { setLoading(false) }
  }

  function openAdd() { setForm({ ...EMPTY, student_id: genID() }); setModal('add') }
  function openEdit(s) { setForm({ full_name:s.full_name, student_id:s.student_id||s.reg_number, school:s.school, department:s.department, year:s.year, semester:s.semester, email:s.email||'', phone:s.phone||'', gender:s.gender||'Male' }); setSelected(s); setModal('edit') }
  function openDel(s)  { setSelected(s); setModal('delete') }
  function closeModal() { setModal(null); setSelected(null) }

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
        <div className="tb-meta">{filtered.length} records</div>
      </div>

      <div className="body">
        <div className="sh">
          <div>
            <div className="sh-title">Student Registry</div>
            <div className="sh-sub">All enrolled students across Strathmore schools</div>
          </div>
          <button className="btn btn-lime" onClick={openAdd}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 1v11M1 6.5h11"/></svg>
            Add Student
          </button>
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
      </div>

      {/* Add / Edit Modal */}
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

      {/* Delete Modal */}
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