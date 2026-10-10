"use client"

import { useEffect } from "react"
import { StyleSheet } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated"
import { Box, type BoxProps } from "../layout/Box"
import { useTheme } from "../../../theme"

export interface SkeletonProps extends BoxProps {
  width?: number | string
  height?: number | string
  borderRadius?: keyof Theme["borderRadii"]
  animation?: "pulse" | "shimmer" | "none"
}

export const Skeleton = ({
  width = "100%",
  height = 16,
  borderRadius = "md",
  animation = "shimmer",
  ...rest
}: SkeletonProps) => {
  const theme = useTheme()
  const opacity = useSharedValue(0.5)
  const translateX = useSharedValue(-100)

  // Set up animation
  useEffect(() => {
    if (animation === "pulse") {
      opacity.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.ease }), -1, true)
    } else if (animation === "shimmer") {
      translateX.value = withRepeat(withTiming(100, { duration: 1000, easing: Easing.ease }), -1, false)
    }
  }, [animation])

  // Animated style for pulse animation
  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  // Animated style for shimmer animation
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return (
    <Box
      width={width}
      height={height}
      borderRadius={borderRadius}
      backgroundColor="buttonDisabled"
      overflow="hidden"
      {...rest}
    >
      {animation === "shimmer" && (
        <Animated.View
          style={[
            styles.shimmer,
            shimmerStyle,
            {
              backgroundColor: theme.colors.cardBackground,
            },
          ]}
        />
      )}
      {animation === "pulse" && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            pulseStyle,
            {
              backgroundColor: theme.colors.cardBackground,
            },
          ]}
        />
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  shimmer: {
    width: "40%",
    height: "100%",
    opacity: 0.3,
  },
})
