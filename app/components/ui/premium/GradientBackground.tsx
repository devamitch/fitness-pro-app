"use client"

import type React from "react"
import type { ReactNode } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/hooks/useTheme"

export interface GradientBackgroundProps {
  children: ReactNode
  colors?: string[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  style?: ViewStyle
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
}) => {
  const { colors: themeColors } = useTheme()

  const gradientColors = colors || [themeColors.primary, themeColors.secondary]

  return (
    <LinearGradient colors={gradientColors} start={start} end={end} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
