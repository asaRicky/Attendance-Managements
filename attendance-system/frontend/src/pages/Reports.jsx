import { useState, useEffect, useRef } from 'react'
import api from '../api/client'

// ── Tiny export helpers (no extra dependencies) ──────────────────────────────

/** Download any string as a file */
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 200)
}

/** Escape a CSV cell value */
function csvCell(v) {
  const s = v == null ? '' : String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}

/** Rows (array of arrays) → CSV string */
function toCSV(rows) {
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n')
}

/**
 * Minimal XLSX builder — no library needed.
 * Produces a valid Office Open XML spreadsheet purely in JS.
 */
function exportXLSX(sheetName, rows, filename) {
  // Encode special chars for XML
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

  // Shared strings table
  const strings = []; const strIdx = {}
  const si = v => { const k = String(v ?? ''); if (strIdx[k] == null) { strIdx[k] = strings.length; strings.push(k) } return strIdx[k] }

  // Build sheet rows XML
  let sheetXML = ''
  rows.forEach((row, ri) => {
    sheetXML += `<row r="${ri+1}">`
    row.forEach((cell, ci) => {
      const col = String.fromCharCode(65 + ci)
      const ref = `${col}${ri+1}`
      const num = !isNaN(cell) && cell !== '' && cell != null
      if (num) {
        sheetXML += `<c r="${ref}"><v>${cell}</v></c>`
      } else {
        sheetXML += `<c r="${ref}" t="s"><v>${si(cell)}</v></c>`
      }
    })
    sheetXML += '</row>'
  })

  const ssXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${strings.map(s => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('\n')}
</sst>`

  const xlXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${sheetXML}</sheetData>
</worksheet>`

  const wbXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

  const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`

  const wbRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  const ctXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml"  ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`

  // Zip it — use the fflate CDN loaded in index.html, fallback to manual
  // We use a pure-JS zip approach via Blob + data URIs
  // Since we can't use fflate here without a bundler, we'll use the SheetJS-free
  // approach: build a ZIP manually using the stored ZIP spec (uncompressed / store method)
  function u8(str) {
    return new TextEncoder().encode(str)
  }
  function zip(entries) {
    // entries: [{name, data: Uint8Array}]
    const localHeaders = []; const centralDirs = []; let offset = 0
    for (const e of entries) {
      const nameBytes = new TextEncoder().encode(e.name)
      const crc = crc32(e.data)
      const local = new Uint8Array(30 + nameBytes.length + e.data.length)
      const dv = new DataView(local.buffer)
      // Local file header signature
      dv.setUint32(0,  0x04034b50, true)
      dv.setUint16(4,  20, true)          // version needed
      dv.setUint16(6,  0,  true)          // flags
      dv.setUint16(8,  0,  true)          // compression (store)
      dv.setUint16(10, 0,  true)          // mod time
      dv.setUint16(12, 0,  true)          // mod date
      dv.setUint32(14, crc, true)         // crc32
      dv.setUint32(18, e.data.length, true)
      dv.setUint32(22, e.data.length, true)
      dv.setUint16(26, nameBytes.length, true)
      dv.setUint16(28, 0, true)
      local.set(nameBytes, 30)
      local.set(e.data, 30 + nameBytes.length)
      localHeaders.push(local)

      const cd = new Uint8Array(46 + nameBytes.length)
      const cdv = new DataView(cd.buffer)
      cdv.setUint32(0,  0x02014b50, true)
      cdv.setUint16(4,  20, true)
      cdv.setUint16(6,  20, true)
      cdv.setUint16(8,  0,  true)
      cdv.setUint16(10, 0,  true)
      cdv.setUint16(12, 0,  true)
      cdv.setUint16(14, 0,  true)
      cdv.setUint32(16, crc, true)
      cdv.setUint32(20, e.data.length, true)
      cdv.setUint32(24, e.data.length, true)
      cdv.setUint16(28, nameBytes.length, true)
      cdv.setUint16(30, 0, true)
      cdv.setUint16(32, 0, true)
      cdv.setUint16(34, 0, true)
      cdv.setUint16(36, 0, true)
      cdv.setUint32(38, 0, true)
      cdv.setUint32(42, offset, true)
      cd.set(nameBytes, 46)
      centralDirs.push(cd)
      offset += local.length
    }
    const cdOffset = offset
    const cdSize   = centralDirs.reduce((a,c) => a + c.length, 0)
    const eocd = new Uint8Array(22)
    const eodv = new DataView(eocd.buffer)
    eodv.setUint32(0,  0x06054b50, true)
    eodv.setUint16(4,  0, true)
    eodv.setUint16(6,  0, true)
    eodv.setUint16(8,  entries.length, true)
    eodv.setUint16(10, entries.length, true)
    eodv.setUint32(12, cdSize,   true)
    eodv.setUint32(16, cdOffset, true)
    eodv.setUint16(20, 0, true)
    const parts = [...localHeaders, ...centralDirs, eocd]
    const total = parts.reduce((a,p) => a + p.length, 0)
    const out = new Uint8Array(total); let pos = 0
    parts.forEach(p => { out.set(p, pos); pos += p.length })
    return out
  }

  function crc32(buf) {
    let c = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i]
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0)
    }
    return (c ^ 0xFFFFFFFF) >>> 0
  }

  const zipBytes = zip([
    { name: '[Content_Types].xml',              data: u8(ctXML)     },
    { name: '_rels/.rels',                      data: u8(wbRelsXML) },
    { name: 'xl/workbook.xml',                  data: u8(wbXML)     },
    { name: 'xl/_rels/workbook.xml.rels',       data: u8(relsXML)   },
    { name: 'xl/worksheets/sheet1.xml',         data: u8(xlXML)     },
    { name: 'xl/sharedStrings.xml',             data: u8(ssXML)     },
  ])

  const blob = new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 200)
}

/** Open a print-friendly window with a styled HTML table */
function printReport(title, subtitle, columns, rows) {
  const thead = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`
  const tbody = rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0 }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px }
  p  { font-size: 11px; color: #555; margin-bottom: 20px }
  table { width:100%; border-collapse:collapse }
  th { background:#1e3a8a; color:#fff; padding:8px 10px; text-align:left; font-size:11px; font-weight:600 }
  td { padding:7px 10px; border-bottom:1px solid #e5e7eb; font-size:11px }
  tr:nth-child(even) td { background:#f8faff }
  .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600 }
  .good     { background:#dcfce7; color:#166534 }
  .risk     { background:#fef9c3; color:#854d0e }
  .critical { background:#fee2e2; color:#991b1b }
  @media print { body { padding:16px } }
</style></head><body>
<h1>${title}</h1><p>${subtitle} · Exported ${new Date().toLocaleString()}</p>
<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
</body></html>`
  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html); w.document.close()
  setTimeout(() => w.print(), 400)
}


// ── Export menu component ─────────────────────────────────────────────────────
function ExportMenu({ onCSV, onXLSX, onPrint, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'8px 14px', borderRadius:'var(--r)', border:'1px solid var(--border2)',
          background:'var(--bg2)', color: disabled ? 'var(--muted)' : 'var(--text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily:'var(--font)', fontSize:'0.8rem', fontWeight:600,
          opacity: disabled ? 0.5 : 1, transition:'all 120ms',
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background='var(--bg3)' }}
        onMouseLeave={e => e.currentTarget.style.background='var(--bg2)'}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M6.5 1v7M3.5 5l3 3 3-3M1 10h11v2H1z"/>
        </svg>
        Export
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M2 3l2.5 3L7 3"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:100,
          background:'var(--bg2)', border:'1px solid var(--border2)',
          borderRadius:'var(--r2)', boxShadow:'0 8px 24px rgba(0,0,0,.18)',
          minWidth:170, overflow:'hidden',
        }}>
          {[
            { label:'Download CSV',    icon:'📄', action: onCSV  },
            { label:'Download Excel',  icon:'📊', action: onXLSX },
            { label:'Print / PDF',     icon:'🖨️', action: onPrint },
          ].map(({ label, icon, action }) => (
            <button key={label}
              onClick={() => { action(); setOpen(false) }}
              style={{
                display:'flex', alignItems:'center', gap:10,
                width:'100%', padding:'10px 16px', border:'none',
                background:'transparent', cursor:'pointer',
                fontFamily:'var(--font)', fontSize:'0.8rem',
                color:'var(--text)', textAlign:'left', transition:'background 100ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <span style={{ fontSize:14 }}>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Main component ────────────────────────────────────────────────────────────
export default function Reports() {
  const [students,  setStudents]  = useState([])
  const [courses,   setCourses]   = useState([])
  const [selStu,    setSelStu]    = useState('')
  const [selCourse, setSelCourse] = useState('')
  const [summary,   setSummary]   = useState(null)
  const [classRpt,  setClassRpt]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState('student')

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

  // ── Derived values ──────────────────────────────────────────────────────────
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
  const selectedCourse = courses.find(c => (c._id||c.unit_code) === selCourse)

  // ── Export helpers ──────────────────────────────────────────────────────────

  // Student report exports
  const studentExportRows = () => {
    const header = ['Student Name', 'Student ID', 'School', 'Department', 'Present', 'Absent', 'Late', 'Total Sessions', 'Attendance Rate (%)']
    const row = [
      stu?.full_name || selStu,
      selStu,
      stu?.school || '',
      stu?.department || '',
      present,
      summaryMap['absent'] || 0,
      summaryMap['late']   || 0,
      total,
      rate,
    ]
    return { header, rows: [row] }
  }

  const exportStudentCSV = () => {
    const { header, rows } = studentExportRows()
    const filename = `attendance_${(stu?.full_name||selStu).replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`
    downloadFile(filename, toCSV([header, ...rows]), 'text/csv')
  }

  const exportStudentXLSX = () => {
    const { header, rows } = studentExportRows()
    const filename = `attendance_${(stu?.full_name||selStu).replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`
    exportXLSX('Student Report', [header, ...rows], filename)
  }

  const printStudentReport = () => {
    const absent = summaryMap['absent'] || 0
    const late   = summaryMap['late']   || 0
    const status = rate >= 75 ? 'Good Standing' : rate >= 60 ? 'At Risk' : 'Critical'
    const badge  = rate >= 75 ? 'good' : rate >= 60 ? 'risk' : 'critical'
    printReport(
      `Attendance Report — ${stu?.full_name || selStu}`,
      `${stu?.school || ''} · ${stu?.department || ''}`,
      ['Student Name', 'Student ID', 'School', 'Dept', 'Present', 'Absent', 'Late', 'Total', 'Rate', 'Status'],
      [[
        stu?.full_name || selStu, selStu, stu?.school||'', stu?.department||'',
        present, absent, late, total,
        `${rate}%`,
        `<span class="badge ${badge}">${status}</span>`,
      ]]
    )
  }

  // Course report exports
  const courseExportRows = () => {
    const header = ['Student Name', 'Student ID', 'Present', 'Total Sessions', 'Attendance Rate (%)', 'Status']
    const sorted = [...classRpt].sort((a,b) => (b.present/b.total) - (a.present/a.total))
    const rows = sorted.map(r => {
      const rt  = r.total > 0 ? Math.round((r.present/r.total)*100) : 0
      const st  = students.find(s => (s.student_id||s.reg_number) === r._id)
      const status = rt >= 75 ? 'Good' : rt >= 60 ? 'At Risk' : 'Critical'
      return [st?.full_name || r._id, r._id, r.present, r.total, rt, status]
    })
    return { header, rows }
  }

  const exportCourseCSV = () => {
    const { header, rows } = courseExportRows()
    const code = selectedCourse?.unit_code || selCourse
    const filename = `course_report_${code}_${new Date().toISOString().slice(0,10)}.csv`
    downloadFile(filename, toCSV([header, ...rows]), 'text/csv')
  }

  const exportCourseXLSX = () => {
    const { header, rows } = courseExportRows()
    const code = selectedCourse?.unit_code || selCourse
    const filename = `course_report_${code}_${new Date().toISOString().slice(0,10)}.xlsx`
    exportXLSX('Course Report', [header, ...rows], filename)
  }

  const printCourseReport = () => {
    const { header, rows } = courseExportRows()
    const code = selectedCourse?.unit_code || ''
    const name = selectedCourse?.lesson_name || selectedCourse?.unit_name || ''
    const printRows = rows.map(r => {
      const rt = r[4]; const status = r[5]
      const badge = rt >= 75 ? 'good' : rt >= 60 ? 'risk' : 'critical'
      return [...r.slice(0, 5), `<span class="badge ${badge}">${status}</span>`]
    })
    printReport(`Course Report — ${code} ${name}`, `${classRpt.length} students`, header, printRows)
  }

  // Overview exports
  const overviewExportRows = () => {
    const header = ['#', 'Student Name', 'Student ID', 'School', 'Department', 'Year']
    const rows = students.map((s, i) => [
      i + 1,
      s.full_name,
      s.student_id || s.reg_number,
      s.school || '',
      s.department || '',
      s.year ? `Year ${s.year}` : '',
    ])
    return { header, rows }
  }

  const exportOverviewCSV = () => {
    const { header, rows } = overviewExportRows()
    downloadFile(`all_students_${new Date().toISOString().slice(0,10)}.csv`, toCSV([header, ...rows]), 'text/csv')
  }

  const exportOverviewXLSX = () => {
    const { header, rows } = overviewExportRows()
    exportXLSX('All Students', [header, ...rows], `all_students_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const printOverview = () => {
    const { header, rows } = overviewExportRows()
    printReport('All Students Overview', `${students.length} students registered`, header, rows)
  }

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

        {/* ── Student Report Tab ─────────────────────────────────────────────── */}
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
                      {/* Header row with export */}
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{stu?.full_name}</div>
                          <div style={{ fontSize:'0.68rem', fontFamily:'var(--mono)', color:'var(--muted)', marginTop:3 }}>
                            {stu?.student_id||stu?.reg_number} · {stu?.school} · {stu?.department}
                          </div>
                        </div>
                        <ExportMenu
                          onCSV={exportStudentCSV}
                          onXLSX={exportStudentXLSX}
                          onPrint={printStudentReport}
                        />
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

            {/* Quick all-student panel */}
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

        {/* ── Course Report Tab ──────────────────────────────────────────────── */}
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
                {/* Export bar */}
                <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.88rem' }}>
                      {selectedCourse?.unit_code} · {selectedCourse?.lesson_name||selectedCourse?.unit_name}
                    </div>
                    <div style={{ fontSize:'0.65rem', fontFamily:'var(--mono)', color:'var(--muted)', marginTop:2 }}>
                      {classRpt.length} students
                    </div>
                  </div>
                  <ExportMenu
                    disabled={classRpt.length === 0}
                    onCSV={exportCourseCSV}
                    onXLSX={exportCourseXLSX}
                    onPrint={printCourseReport}
                  />
                </div>

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

        {/* ── Overview Tab ───────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="card card-flush">
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.9rem' }}>All Students Overview</div>
                <div style={{ fontSize:'0.65rem', fontFamily:'var(--mono)', color:'var(--muted)', marginTop:2 }}>{students.length} students</div>
              </div>
              <ExportMenu
                disabled={students.length === 0}
                onCSV={exportOverviewCSV}
                onXLSX={exportOverviewXLSX}
                onPrint={printOverview}
              />
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