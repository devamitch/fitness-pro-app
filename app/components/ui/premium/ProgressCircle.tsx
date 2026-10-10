"use client"

import type { ReactNode } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"
import { Box } from "../layout/Box"
import { useTheme, type Theme } from "../../../theme"
import { useEffect } from "react"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export interface ProgressCircleProps {
  progress: number
  size: number
  strokeWidth: number
  progressColor?: keyof Theme["colors"]
  backgroundColor?: keyof Theme["colors"]
  children?: ReactNode
  style?: ViewStyle
  rotation?: number
  lineCap?: "butt" | "round" | "square"
  duration?: number
}

export const ProgressCircle = ({
  progress,
  size,
  strokeWidth,
  progressColor = "primary",
  backgroundColor = "buttonDisabled",
  children,
  style,
  rotation = -90,
  lineCap = "round",
  duration = 1000,
}: ProgressCircleProps) => {
  const theme = useTheme()
  const animatedProgress = useSharedValue(0)

  // Calculate radius and center
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  // Update progress animation
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration })
  }, [progress, duration])

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value)
    return {
      strokeDashoffset,
    }
  })

  return (
    <Box style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors[backgroundColor]}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors[progressColor]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="transparent"
          strokeLinecap={lineCap}
          rotation={rotation}
          originX={center}
          originY={center}
        />
      </Svg>

      {/* Children (e.g., text) */}
      {children && <Box style={styles.childrenContainer}>{children}</Box>}
    </Box>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  svg: {
    position: "absolute",
  },
  childrenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
})
