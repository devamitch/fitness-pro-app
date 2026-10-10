"use client"

import type React from "react"
import { StyleSheet, type ViewProps, View } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeIn } from "react-native-reanimated"
import { useTheme } from "../theme/theme"

interface GlassMorphicCardProps extends ViewProps {
  intensity?: number
  tint?: "light" | "dark" | "default"
  animated?: boolean
}

export const GlassMorphicCard: React.FC<GlassMorphicCardProps> = ({
  children,
  intensity = 50,
  tint: propTint,
  animated = true,
  style,
  ...props
}) => {
  const theme = useTheme()

  const tint = propTint || (theme.dark ? "dark" : "light")

  const Container = animated ? Animated.View : View
  const animationProps = animated ? { entering: FadeIn.duration(500) } : {}

  return (
    <Container style={[styles.container, style]} {...animationProps} {...props}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.border,
          {
            borderColor: theme.colors.glass.border,
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
})
