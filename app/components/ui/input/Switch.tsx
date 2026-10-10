"use client"

import { Pressable } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface SwitchProps {
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  disabled?: boolean
}

export const Switch = ({ value, onChange, label, disabled = false }: SwitchProps) => {
  const theme = useTheme()

  // Animation values
  const offset = useSharedValue(value ? 1 : 0)

  // Update animation when value changes
  if ((value && offset.value !== 1) || (!value && offset.value !== 0)) {
    offset.value = value ? 1 : 0
  }

  // Handle press
  const handlePress = () => {
    if (!disabled) {
      const newValue = !value
      onChange(newValue)
      offset.value = withSpring(newValue ? 1 : 0)
    }
  }

  // Animated styles for the track
  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(offset.value, [0, 1], [theme.colors.buttonDisabled, theme.colors.primary])

    return {
      backgroundColor,
    }
  })

  // Animated styles for the thumb
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(offset.value * 20, {
            damping: 15,
            stiffness: 120,
          }),
        },
      ],
    }
  })

  return (
    <Box flexDirection="row" alignItems="center">
      <Pressable onPress={handlePress} disabled={disabled}>
        <Animated.View
          style={[
            {
              width: 50,
              height: 30,
              borderRadius: 15,
              justifyContent: "center",
              padding: 5,
              opacity: disabled ? 0.5 : 1,
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.colors.white,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </Pressable>

      {label && (
        <Text marginLeft="sm" color={disabled ? "textMuted" : "text"}>
          {label}
        </Text>
      )}
    </Box>
  )
}
