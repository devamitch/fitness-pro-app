"use client"

import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import type { PropsWithChildren } from "react"
import { useTheme } from "./useTheme"

interface NavigationThemeProviderProps extends PropsWithChildren {
  navigationRef?: any
  initialState?: any
  onStateChange?: (state: any) => void
  fallback?: React.ReactNode
}

export const NavigationThemeProvider = ({
  children,
  navigationRef,
  initialState,
  onStateChange,
  fallback,
}: NavigationThemeProviderProps) => {
  const theme = useTheme()
  //   const systemColorScheme = useColorScheme() || "light"
  const isDarkMode = theme.isDarkMode

  // Create navigation theme
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.cardBackground,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      ref={navigationRef}
      initialState={initialState}
      onStateChange={onStateChange}
      fallback={fallback}
    >
      {children}
    </NavigationContainer>
  )
}
