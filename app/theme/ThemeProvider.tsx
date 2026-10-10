// "use client"

// import type { PropsWithChildren } from "react"
// import { useColorScheme } from "react-native"
// import { ThemeProvider as RestyleThemeProvider } from "@shopify/restyle"
// import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
// import { darkTheme, lightTheme } from "."
// import { useThemeStore } from "./store"

// interface ThemeProviderProps extends PropsWithChildren {
//   colorScheme?: string | null
// }

// export const ThemeProvider = ({ children, colorScheme = "light" }: ThemeProviderProps) => {
//   const systemColorScheme = useColorScheme() || "light"
//   const { mode, isDarkMode } = useThemeStore()

//   // Determine if we're in dark mode based on mode setting and system theme
//   const isAppDarkMode = isDarkMode(systemColorScheme)

//   // Use the appropriate theme based on dark mode
//   const theme = isAppDarkMode ? darkTheme : lightTheme

//   // Create navigation theme
//   const navigationTheme = {
//     ...(isAppDarkMode ? DarkTheme : DefaultTheme),
//     colors: {
//       ...(isAppDarkMode ? DarkTheme.colors : DefaultTheme.colors),
//       primary: theme.colors.primary,
//       background: theme.colors.background,
//       card: theme.colors.cardBackground,
//       text: theme.colors.text,
//       border: theme.colors.border,
//       notification: theme.colors.error,
//     },
//   }

//   return (
//     <RestyleThemeProvider theme={theme}>
//       <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>
//     </RestyleThemeProvider>
//   )
// }

"use client"

import { ThemeProvider as RestyleThemeProvider } from "@shopify/restyle"
import type { PropsWithChildren } from "react"
import { useColorScheme } from "react-native"
import { useThemeStore } from "./store"
import { darkTheme, lightTheme } from "./theme"

interface ThemeProviderProps extends PropsWithChildren {
  colorScheme?: string | null
}

export const ThemeProvider = ({ children, colorScheme = "light" }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme() || "light"
  const { mode, isDarkMode } = useThemeStore()

  // Determine if we're in dark mode based on mode setting and system theme
  const isAppDarkMode = isDarkMode(systemColorScheme)

  // Use the appropriate theme based on dark mode
  const theme = isAppDarkMode ? darkTheme : lightTheme

  return <RestyleThemeProvider theme={theme}>{children}</RestyleThemeProvider>
}
