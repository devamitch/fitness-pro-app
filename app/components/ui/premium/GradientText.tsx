"use client"

import type { ReactNode } from "react"
import { StyleSheet, Platform } from "react-native"
import MaskedView from "@react-native-masked-view/masked-view"
import { LinearGradient } from "expo-linear-gradient"
import { Text, type TextProps } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface GradientTextProps extends TextProps {
  colors?: string[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  children: ReactNode
}

export const GradientText = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  ...rest
}: GradientTextProps) => {
  const theme = useTheme()

  // Default gradient colors based on theme
  const gradientColors = colors || [theme.colors.primary, theme.colors.secondary, theme.colors.accent]

  // On Android, we need to use a different approach due to MaskedView limitations
  if (Platform.OS === "android") {
    return (
      <LinearGradient colors={gradientColors} start={start} end={end} style={StyleSheet.absoluteFill}>
        <Text
          style={[
            style,
            {
              opacity: 0.5, // This is a hack to make the gradient visible through the text
              backgroundColor: "transparent",
            },
          ]}
          {...rest}
        />
      </LinearGradient>
    )
  }

  // On iOS, we can use MaskedView
  return (
    <MaskedView maskElement={<Text style={style} {...rest} />}>
      <LinearGradient colors={gradientColors} start={start} end={end} style={StyleSheet.absoluteFill} />
    </MaskedView>
  )
}
