"use client"

import type React from "react"
import { Text as RNText, StyleSheet, type TextStyle } from "react-native"
import { useTheme } from "../../hooks/useTheme"

type TextVariant = "header" | "title" | "subtitle" | "body" | "caption" | "button"

interface TextProps {
  children: React.ReactNode
  variant?: TextVariant
  style?: TextStyle
  numberOfLines?: number
}

export const Text: React.FC<TextProps> = ({ children, variant = "body", style, numberOfLines }) => {
  const theme = useTheme()

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "header":
        return {
          fontSize: 28,
          fontWeight: "700",
          color: theme.colors.text.primary,
        }
      case "title":
        return {
          fontSize: 22,
          fontWeight: "600",
          color: theme.colors.text.primary,
        }
      case "subtitle":
        return {
          fontSize: 18,
          fontWeight: "600",
          color: theme.colors.text.primary,
        }
      case "body":
        return {
          fontSize: 16,
          fontWeight: "400",
          color: theme.colors.text.primary,
        }
      case "caption":
        return {
          fontSize: 14,
          fontWeight: "400",
          color: theme.colors.text.secondary,
        }
      case "button":
        return {
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.primary,
        }
      default:
        return {
          fontSize: 16,
          fontWeight: "400",
          color: theme.colors.text.primary,
        }
    }
  }

  return (
    <RNText style={[getTextStyle(), style]} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  )
}

const styles = StyleSheet.create({})
