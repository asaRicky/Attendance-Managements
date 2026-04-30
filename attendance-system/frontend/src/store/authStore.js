import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user:  null,

      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),

      isLoggedIn: () => !!get().token,

      updateUser: (partial) =>
        set(state => ({ user: { ...state.user, ...partial } })),
    }),
    {
      name:    'attendiq-auth',  // localStorage key
      version: 1,
      // Only persist these two fields — nothing else
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)