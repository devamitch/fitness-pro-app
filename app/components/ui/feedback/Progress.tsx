"use client"

import { useEffect } from "react"
import { StyleSheet } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import type { Theme } from "../../../theme/theme"

export interface ProgressProps {
  value: number
  max?: number
  height?: number
  showLabel?: boolean
  color?: keyof Theme["colors"]
  label?: string
}

export const Progress = ({
  value,
  max = 100,
  height = 8,
  showLabel = false,
  color = "primary",
  label,
}: ProgressProps) => {
  const theme = useTheme()
  const progress = useSharedValue(0)

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  // Update progress when value changes
  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [percentage])

  // Animated style for the progress bar
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    }
  })

  return (
    <Box width="100%">
      {(label || showLabel) && (
        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="xs">
          {label && (
            <Text variant="caption" color="textSecondary">
              {label}
            </Text>
          )}
          {showLabel && (
            <Text variant="caption" color="textSecondary">
              {Math.round(percentage)}%
            </Text>
          )}
        </Box>
      )}

      <Box height={height} backgroundColor="buttonDisabled" borderRadius="rounded" overflow="hidden">
        <Animated.View
          style={[
            styles.progressBar,
            progressStyle,
            {
              height,
              backgroundColor: theme.colors[color],
            },
          ]}
        />
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
  },
})
