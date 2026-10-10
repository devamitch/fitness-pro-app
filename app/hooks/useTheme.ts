import { useColorScheme } from "react-native"
import { useThemeStore } from "../stores/themeStore"

// Define theme types
export type ThemeMode = "light" | "dark" | "system"

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: {
    primary: string
    secondary: string
    tertiary: string
  }
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  card: {
    background: string
    border: string
  }
  status: {
    success: string
    error: string
    warning: string
    info: string
  }
  shadow: string
}

export interface Theme {
  colors: ThemeColors
  dark: boolean
}

// Define light and dark themes
const lightTheme: Theme = {
  colors: {
    primary: "#0A84FF",
    secondary: "#32D74B",
    accent: "#FF9500",
    background: {
      primary: "#F2F2F7",
      secondary: "#FFFFFF",
      tertiary: "#E5E5EA",
    },
    text: {
      primary: "#000000",
      secondary: "#3C3C43",
      tertiary: "#8E8E93",
      inverse: "#FFFFFF",
    },
    card: {
      background: "#FFFFFF",
      border: "#E5E5EA",
    },
    status: {
      success: "#32D74B",
      error: "#FF3B30",
      warning: "#FF9500",
      info: "#0A84FF",
    },
    shadow: "#000000",
  },
  dark: false,
}

const darkTheme: Theme = {
  colors: {
    primary: "#0A84FF",
    secondary: "#32D74B",
    accent: "#FF9500",
    background: {
      primary: "#1C1C1E",
      secondary: "#2C2C2E",
      tertiary: "#3A3A3C",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#EBEBF5",
      tertiary: "#8E8E93",
      inverse: "#000000",
    },
    card: {
      background: "#2C2C2E",
      border: "#3A3A3C",
    },
    status: {
      success: "#32D74B",
      error: "#FF3B30",
      warning: "#FF9500",
      info: "#0A84FF",
    },
    shadow: "#000000",
  },
  dark: true,
}

export const useTheme = (): Theme => {
  const { theme: themeMode } = useThemeStore()
  const colorScheme = useColorScheme()

  // Determine which theme to use
  const isDark = themeMode === "system" ? colorScheme === "dark" : themeMode === "dark"

  return isDark ? darkTheme : lightTheme
}
