"use client"

import type React from "react"
import { View, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "../../../theme"

interface GradientIconProps {
  icon: React.ReactNode
  colors?: string[]
  size?: number
}

export const GradientIcon: React.FC<GradientIconProps> = ({ icon, colors, size = 40 }) => {
  const theme = useTheme()

  const defaultColors = colors || [theme.colors.primary, theme.colors.secondary]

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={defaultColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.gradient]}
      />
      {icon}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    borderRadius: 20,
  },
})
