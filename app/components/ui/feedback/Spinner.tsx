"use client"

import { ActivityIndicator, StyleSheet } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import type { Theme } from "../../../theme/theme"

export interface SpinnerProps {
  size?: "small" | "medium" | "large"
  color?: keyof Theme["colors"]
  label?: string
  type?: "default" | "custom"
}

export const Spinner = ({ size = "medium", color = "primary", label, type = "default" }: SpinnerProps) => {
  const theme = useTheme()
  const rotation = useSharedValue(0)

  // Set up rotation animation for custom spinner
  if (type === "custom") {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    )
  }

  // Get size in pixels
  const getSizeInPixels = () => {
    switch (size) {
      case "small":
        return 16
      case "large":
        return 36
      case "medium":
      default:
        return 24
    }
  }

  // Animated style for custom spinner
  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  return (
    <Box alignItems="center">
      {type === "default" ? (
        <ActivityIndicator size={size} color={theme.colors[color]} />
      ) : (
        <Animated.View
          style={[
            styles.customSpinner,
            spinnerStyle,
            {
              width: getSizeInPixels(),
              height: getSizeInPixels(),
              borderColor: theme.colors[color],
            },
          ]}
        />
      )}

      {label && (
        <Text variant="caption" color="textSecondary" marginTop="xs">
          {label}
        </Text>
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  customSpinner: {
    borderWidth: 2,
    borderRadius: 999,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
})
