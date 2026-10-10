import { storage } from "@/utils/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  token: string | null
  initialized: boolean
  isAuthenticated: boolean
  authenticated?: boolean
  onboarded?: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setInitialized: (initialized: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      initialized: false,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setInitialized: (initialized) => set({ initialized }),
      signOut: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name)
          return value ? Promise.resolve(JSON.parse(value)) : Promise.resolve(null)
        },
        setItem: (name, value) => {
          storage.set(name, JSON.stringify(value))
          return Promise.resolve()
        },
        removeItem: (name) => {
          storage.delete(name)
          return Promise.resolve()
        },
      })),
    },
  ),
)
