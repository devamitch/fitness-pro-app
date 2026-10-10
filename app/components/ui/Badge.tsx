"use client"

import type React from "react"
import { View, StyleSheet, type ViewStyle, type TextStyle } from "react-native"
import { Text } from "./Text"
import { useTheme } from "@/hooks/useTheme"

export interface BadgeProps {
  label: string
  variant?: "primary" | "success" | "warning" | "error" | "info"
  size?: "small" | "medium" | "large"
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = "primary", size = "medium", style, textStyle }) => {
  const { colors } = useTheme()

  const getBackgroundColor = () => {
    switch (variant) {
      case "success":
        return colors.success
      case "warning":
        return colors.warning
      case "error":
        return colors.error
      case "info":
        return colors.info
      default:
        return colors.primary
    }
  }

  const getTextColor = () => {
    return "#FFFFFF"
  }

  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingVertical: 2, paddingHorizontal: 6 }
      case "large":
        return { paddingVertical: 8, paddingHorizontal: 16 }
      default:
        return { paddingVertical: 4, paddingHorizontal: 12 }
    }
  }

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 10
      case "large":
        return 14
      default:
        return 12
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        style={[
          {
            color: getTextColor(),
            fontSize: getFontSize(),
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    alignSelf: "flex-start",
  },
})
