"use client"

import type { ReactNode } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
import { BlurView } from "expo-blur"
import { Box } from "../layout/Box"
import { useTheme } from "../../../theme"

export interface BlurredBackgroundProps {
  children: ReactNode
  intensity?: number
  tint?: "light" | "dark" | "default"
  style?: ViewStyle
  overlayColor?: string
  overlayOpacity?: number
}

export const BlurredBackground = ({
  children,
  intensity = 50,
  tint: propTint,
  style,
  overlayColor = "#000000",
  overlayOpacity = 0.3,
}: BlurredBackgroundProps) => {
  const theme = useTheme()

  // Determine tint based on theme if not provided
  const tint = propTint || (theme.isDarkMode ? "dark" : "light")

  return (
    <Box style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />

      {/* Optional overlay for better contrast */}
      <Box
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          },
        ]}
      />

      {/* Content */}
      <Box style={styles.content}>{children}</Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
})
