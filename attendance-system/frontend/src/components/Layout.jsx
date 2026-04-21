import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', exact: true,
    icon: <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2"/></svg> },
  { to: '/dashboard/students', label: 'Students',
    icon: <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/></svg> },
  { to: '/dashboard/courses', label: 'Courses',
    icon: <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg> },
  { to: '/dashboard/attendance', label: 'Attendance',
    icon: <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v4M11 1v4M2 7h12"/><path d="M5.5 10.5l1.5 1.5 3-3"/></svg> },
  { to: '/dashboard/reports', label: 'Reports',
    icon: <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12V4l4-2 4 2 4-2v8l-4 2-4-2-4 2z"/></svg> },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SU'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-logo-mark">AI</div>
          <div className="sb-brand-text">
            <div className="sb-name">AttendIQ</div>
            <div className="sb-sub">{user?.school || 'Attendance Portal'}</div>
          </div>
        </div>

        <div className="sb-section">Main</div>
        <nav className="sb-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to} to={n.to} end={n.exact}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* pushes everything below to the bottom */}
        <div style={{ flex: 1 }} />

        <div className="sb-section">Account</div>
        <div style={{ padding: '0 10px 8px' }}>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="8" cy="8" r="2.5"/>
              <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M11.9 3.4l-.7.7M3.4 11.9l.7-.7"/>
            </svg>
            Settings
          </NavLink>
          <button className="nav-link" onClick={() => { logout(); navigate('/') }}>
            <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/>
            </svg>
            Sign Out
          </button>
        </div>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div>
              <div className="sb-uname">{user?.full_name || 'Lecturer'}</div>
              <div className="sb-urole">{user?.role || 'lecturer'}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}