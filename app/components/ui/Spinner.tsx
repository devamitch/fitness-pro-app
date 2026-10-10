"use client"

import type React from "react"
import { View, StyleSheet, ActivityIndicator, type ViewStyle } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { Text } from "./Text"

export interface SpinnerProps {
  size?: "small" | "large"
  color?: string
  style?: ViewStyle
  text?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "small", color, style, text }) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color || colors.primary} />
      {text && (
        <Text variant="caption" style={[styles.text, { color: colors.textSecondary }]}>
          {text}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 8,
  },
})
