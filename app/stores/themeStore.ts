import { storage } from "@/utils/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type ThemeMode = "light" | "dark" | "system"

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "theme-storage",
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
