"use client"

import { useState } from "react"
import { StyleSheet } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface SliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  step?: number
  label?: string
  showValue?: boolean
  disabled?: boolean
}

export const Slider = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  showValue = true,
  disabled = false,
}: SliderProps) => {
  const theme = useTheme()
  const [width, setWidth] = useState(0)

  // Calculate the initial position
  const initialPosition = ((value - min) / (max - min)) * width
  const position = useSharedValue(initialPosition)

  // Update position when value changes externally
  if (position.value !== initialPosition && width > 0) {
    position.value = initialPosition
  }

  // Handle pan gesture
  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      let newPosition = e.absoluteX

      // Clamp position to track bounds
      newPosition = Math.max(0, Math.min(newPosition, width))

      // Update position
      position.value = newPosition

      // Calculate and round value based on step
      const rawValue = min + (newPosition / width) * (max - min)
      const steppedValue = Math.round(rawValue / step) * step

      // Clamp value to min/max
      const clampedValue = Math.max(min, Math.min(steppedValue, max))

      // Update value
      onChange(clampedValue)
    })
    .onEnd(() => {
      // Add a small spring animation when released
      position.value = withSpring(position.value)
    })

  // Animated styles for the thumb
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: position.value }],
    }
  })

  // Animated styles for the active track
  const activeTrackStyle = useAnimatedStyle(() => {
    return {
      width: position.value,
    }
  })

  return (
    <Box width="100%">
      {(label || showValue) && (
        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="xs">
          {label && (
            <Text variant="caption" color="textSecondary">
              {label}
            </Text>
          )}
          {showValue && (
            <Text variant="caption" color="textSecondary">
              {value}
            </Text>
          )}
        </Box>
      )}

      <GestureDetector gesture={gesture}>
        <Box
          height={40}
          justifyContent="center"
          opacity={disabled ? 0.5 : 1}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {/* Background track */}
          <Box height={4} backgroundColor="buttonDisabled" borderRadius="rounded" />

          {/* Active track */}
          <Animated.View
            style={[
              styles.activeTrack,
              activeTrackStyle,
              { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadii.rounded },
            ]}
          />

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              thumbStyle,
              {
                backgroundColor: theme.colors.white,
                borderColor: theme.colors.primary,
                shadowColor: theme.colors.shadow,
              },
            ]}
          />
        </Box>
      </GestureDetector>
    </Box>
  )
}

const styles = StyleSheet.create({
  activeTrack: {
    position: "absolute",
    height: 4,
    left: 0,
  },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: "white",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    transform: [{ translateX: -10 }],
  },
})
