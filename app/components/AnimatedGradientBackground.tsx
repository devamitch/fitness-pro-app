"use client"

import type React from "react"
import { useEffect } from "react"
import { StyleSheet, type ViewProps } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated"
import { useTheme } from "../theme/theme"

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

interface AnimatedGradientBackgroundProps extends ViewProps {
  intensity?: number
  speed?: number
}

export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  children,
  intensity = 0.5,
  speed = 1,
  style,
  ...props
}) => {
  const theme = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 10000 / speed, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [speed])

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 360])
    return {
      transform: [{ rotate: `${rotate}deg` }],
    }
  })

  const colors = theme.dark
    ? [
        `rgba(10, 132, 255, ${0.1 * intensity})`,
        `rgba(50, 215, 75, ${0.1 * intensity})`,
        `rgba(255, 149, 0, ${0.1 * intensity})`,
        `rgba(10, 132, 255, ${0.1 * intensity})`,
      ]
    : [
        `rgba(10, 132, 255, ${0.05 * intensity})`,
        `rgba(50, 215, 75, ${0.05 * intensity})`,
        `rgba(255, 149, 0, ${0.05 * intensity})`,
        `rgba(10, 132, 255, ${0.05 * intensity})`,
      ]

  return (
    <AnimatedLinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedLinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
})
