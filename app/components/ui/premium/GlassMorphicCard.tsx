"use client"

import type { ReactNode } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
import { BlurView } from "expo-blur"
import { Box } from "../layout/Box"
import { useTheme } from "../../../theme"
import type { Theme } from "../../../theme/theme"

export interface GlassMorphicCardProps {
  children: ReactNode
  intensity?: number
  tint?: "light" | "dark" | "default"
  style?: ViewStyle
  borderRadius?: keyof Theme["borderRadii"]
  padding?: keyof Theme["spacing"]
}

export const GlassMorphicCard = ({
  children,
  intensity = 50,
  tint: propTint,
  style,
  borderRadius = "lg",
  padding = "md",
}: GlassMorphicCardProps) => {
  const theme = useTheme()

  // Determine tint based on theme if not provided
  const tint = propTint || (theme.isDarkMode ? "dark" : "light")

  return (
    <Box
      borderRadius={borderRadius}
      overflow="hidden"
      style={[
        styles.container,
        {
          borderColor: `rgba(255, 255, 255, ${theme.isDarkMode ? 0.1 : 0.2})`,
        },
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <Box padding={padding}>{children}</Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
})
