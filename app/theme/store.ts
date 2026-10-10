import { create } from "zustand"
import { persist } from "zustand/middleware"
import { mmkvStorage } from "../utils/storage"
import type { ThemeMode } from "./types"

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  isSystemMode: () => boolean
  isDarkMode: (systemColorScheme?: string | null) => boolean
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system" as ThemeMode,

      setMode: (mode: ThemeMode) => {
        set({ mode })
      },

      toggleMode: () => {
        const currentMode = get().mode
        if (currentMode === "light") {
          set({ mode: "dark" })
        } else if (currentMode === "dark") {
          set({ mode: "system" })
        } else {
          set({ mode: "light" })
        }
      },

      isSystemMode: () => get().mode === "system",

      isDarkMode: (systemColorScheme = "light") => {
        const mode = get().mode
        return mode === "dark" || (mode === "system" && systemColorScheme === "dark")
      },
    }),
    {
      name: "fitness-app-theme",
      storage: mmkvStorage,
    },
  ),
)
