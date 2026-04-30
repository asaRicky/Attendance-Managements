import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login, preserving the
 * page they were trying to reach so we can send them back after login.
 *
 * Usage in your router:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const token    = useAuthStore(s => s.token)
  const location = useLocation()

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}   // login page can redirect back here
      />
    )
  }

  return children
}