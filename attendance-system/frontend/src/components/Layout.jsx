import { Outlet, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/reports', label: 'Reports' },
]

export default function Layout() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-gray-900 text-white flex flex-col p-4 gap-2">
        <h2 className="text-lg font-semibold mb-4">AttendanceMS</h2>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end className={({ isActive }) =>
            `px-3 py-2 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            {l.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
