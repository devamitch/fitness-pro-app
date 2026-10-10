"use client"

import type React from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { useTheme } from "../../hooks/useTheme"

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: "default" | "elevated" | "outlined"
}

export const Card: React.FC<CardProps> = ({ children, style, variant = "default" }) => {
  const theme = useTheme()

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card.background,
      borderRadius: 12,
      padding: 16,
    }

    switch (variant) {
      case "elevated":
        baseStyle.elevation = 4
        baseStyle.shadowColor = theme.colors.shadow
        baseStyle.shadowOffset = { width: 0, height: 2 }
        baseStyle.shadowOpacity = 0.1
        baseStyle.shadowRadius = 8
        break
      case "outlined":
        baseStyle.borderWidth = 1
        baseStyle.borderColor = theme.colors.card.border
        break
    }

    return baseStyle
  }

  return <View style={[getCardStyle(), style]}>{children}</View>
}

const styles = StyleSheet.create({})
