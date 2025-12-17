import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { authApi } from '@/lib/api'
import { CryptoClient } from '@/lib/crypto'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password })
        const user = response.data.user
        set({ user, isAuthenticated: true })
      },

      register: async (username: string, email: string, password: string) => {
        const response = await authApi.register({ username, email, password })
        const { user, private_key } = response.data

        CryptoClient.savePrivateKey(user.id, private_key)

        set({ user, isAuthenticated: true })
      },

      logout: () => {
        const user = useAuth.getState().user
        if (user) {
          CryptoClient.removePrivateKey(user.id)
        }
        set({ user: null, isAuthenticated: false })
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
