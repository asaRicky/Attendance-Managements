import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

// ── Attach JWT to every outgoing request ──────────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// ── Auto-logout on 401 (expired / invalid token) ──────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      // Avoid redirect loop if already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api