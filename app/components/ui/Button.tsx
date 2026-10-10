"use client"

import type React from "react"
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
} from "react-native"
import { useTheme } from "../../hooks/useTheme"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"
type ButtonSize = "small" | "medium" | "large"

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const theme = useTheme()

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    }

    // Size styles
    switch (size) {
      case "small":
        baseStyle.paddingVertical = 8
        baseStyle.paddingHorizontal = 16
        break
      case "medium":
        baseStyle.paddingVertical = 12
        baseStyle.paddingHorizontal = 20
        break
      case "large":
        baseStyle.paddingVertical = 16
        baseStyle.paddingHorizontal = 24
        break
    }

    // Variant styles
    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = theme.colors.primary
        break
      case "secondary":
        baseStyle.backgroundColor = theme.colors.secondary
        break
      case "outline":
        baseStyle.backgroundColor = "transparent"
        baseStyle.borderWidth = 1
        baseStyle.borderColor = theme.colors.primary
        break
      case "ghost":
        baseStyle.backgroundColor = "transparent"
        break
    }

    // Disabled state
    if (disabled) {
      baseStyle.opacity = 0.5
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: size === "small" ? 14 : 16,
      fontWeight: "600",
    }

    switch (variant) {
      case "primary":
      case "secondary":
        baseStyle.color = theme.colors.text.inverse
        break
      case "outline":
      case "ghost":
        baseStyle.color = theme.colors.primary
        break
    }

    return baseStyle
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "secondary" ? theme.colors.text.inverse : theme.colors.primary}
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 8,
  },
})
