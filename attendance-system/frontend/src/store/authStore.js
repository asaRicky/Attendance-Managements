import { create } from 'zustand'

export const useAuthStore = create(set => ({
  token: localStorage.getItem('aiq_token') || null,
  user:  JSON.parse(localStorage.getItem('aiq_user') || 'null'),

  login(token, user) {
    localStorage.setItem('aiq_token', token)
    localStorage.setItem('aiq_user', JSON.stringify(user))
    set({ token, user })
  },
  logout() {
    localStorage.removeItem('aiq_token')
    localStorage.removeItem('aiq_user')
    set({ token: null, user: null })
  },
}))