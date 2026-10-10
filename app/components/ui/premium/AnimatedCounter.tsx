"use client"

import { useEffect } from "react"
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated"
import { Text as RNText } from "react-native"
import { Text, type TextProps } from "../typography/Text"

const AnimatedText = Animated.createAnimatedComponent(RNText)

export interface AnimatedCounterProps extends Omit<TextProps, "children"> {
  value: number
  duration?: number
  formatter?: (value: number) => string
  decimalPlaces?: number
}

export const AnimatedCounter = ({
  value,
  duration = 1000,
  formatter,
  decimalPlaces = 0,
  ...rest
}: AnimatedCounterProps) => {
  const animatedValue = useSharedValue(0)

  // Update animation when value changes
  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [value, duration])

  // Format the animated value
  const animatedProps = useAnimatedProps(() => {
    const currentValue = animatedValue.value

    // Apply formatter if provided, otherwise format based on decimal places
    const formattedValue = formatter ? formatter(currentValue) : currentValue.toFixed(decimalPlaces)

    return {
      text: formattedValue,
    }
  })

  return (
    <Text {...rest} asComponent>
      <AnimatedText animatedProps={animatedProps} />
    </Text>
  )
}
