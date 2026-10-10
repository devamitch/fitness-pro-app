"use client"

import type React from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "@/hooks/useTheme"

export interface SafeAreaWrapperProps {
  children: React.ReactNode
  style?: ViewStyle
  edges?: Array<"top" | "right" | "bottom" | "left">
  backgroundColor?: string
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  edges = ["top", "right", "bottom", "left"],
  backgroundColor,
}) => {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  const bgColor = backgroundColor || colors.background

  const safeAreaStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    backgroundColor: bgColor,
  }

  return <View style={[styles.container, safeAreaStyle, style]}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
