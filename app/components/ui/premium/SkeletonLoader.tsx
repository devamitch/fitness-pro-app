"use client"

import type { ReactNode } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { useTheme } from "../../../theme"
import type { Theme } from "../../../theme/theme"

export interface SkeletonLoaderProps {
  isLoading: boolean
  children: ReactNode
  layout?: "default" | "card" | "list" | "profile"
  backgroundColor?: keyof Theme["colors"]
  highlightColor?: keyof Theme["colors"]
  speed?: number
  style?: ViewStyle
}

export const SkeletonLoader = ({
  isLoading,
  children,
  layout = "default",
  backgroundColor = "buttonDisabled",
  highlightColor = "cardBackground",
  speed = 1000,
  style,
}: SkeletonLoaderProps) => {
  const theme = useTheme()
  const translateX = useSharedValue(-100)

  // Set up animation
  if (isLoading) {
    translateX.value = withRepeat(withTiming(100, { duration: speed, easing: Easing.ease }), -1, false)
  }

  // Animated style for shimmer effect
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${translateX.value}%` }],
    }
  })

  // Render skeleton based on layout
  const renderSkeleton = () => {
    switch (layout) {
      case "card":
        return (
          <Box
            width="100%"
            height={200}
            borderRadius="lg"
            backgroundColor={backgroundColor}
            overflow="hidden"
            style={style}
          >
            <Animated.View style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]} />
          </Box>
        )
      case "list":
        return (
          <Box width="100%" style={style}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                flexDirection="row"
                alignItems="center"
                padding="md"
                borderBottomWidth={1}
                borderBottomColor="border"
              >
                <Box
                  width={40}
                  height={40}
                  borderRadius="rounded"
                  backgroundColor={backgroundColor}
                  marginRight="md"
                  overflow="hidden"
                >
                  <Animated.View
                    style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]}
                  />
                </Box>
                <Box flex={1}>
                  <Box
                    width="70%"
                    height={16}
                    backgroundColor={backgroundColor}
                    borderRadius="sm"
                    marginBottom="xs"
                    overflow="hidden"
                  >
                    <Animated.View
                      style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]}
                    />
                  </Box>
                  <Box width="40%" height={12} backgroundColor={backgroundColor} borderRadius="sm" overflow="hidden">
                    <Animated.View
                      style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )
      case "profile":
        return (
          <Box alignItems="center" padding="md" style={style}>
            <Box
              width={80}
              height={80}
              borderRadius="rounded"
              backgroundColor={backgroundColor}
              marginBottom="md"
              overflow="hidden"
            >
              <Animated.View
                style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]}
              />
            </Box>
            <Box
              width={150}
              height={20}
              backgroundColor={backgroundColor}
              borderRadius="sm"
              marginBottom="sm"
              overflow="hidden"
            >
              <Animated.View
                style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]}
              />
            </Box>
            <Box width={100} height={16} backgroundColor={backgroundColor} borderRadius="sm" overflow="hidden">
              <Animated.View
                style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]}
              />
            </Box>
          </Box>
        )
      case "default":
      default:
        return (
          <Box
            width="100%"
            height={100}
            backgroundColor={backgroundColor}
            borderRadius="md"
            overflow="hidden"
            style={style}
          >
            <Animated.View style={[styles.shimmer, shimmerStyle, { backgroundColor: theme.colors[highlightColor] }]} />
          </Box>
        )
    }
  }

  return isLoading ? renderSkeleton() : <>{children}</>
}

const styles = StyleSheet.create({
  shimmer: {
    width: "40%",
    height: "100%",
    opacity: 0.3,
  },
})
