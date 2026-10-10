"use client"

import type React from "react"
import { useEffect } from "react"
import { Animated, type ViewStyle } from "react-native"

export interface FadeInViewProps {
  children: React.ReactNode
  duration?: number
  delay?: number
  style?: ViewStyle
  initialOpacity?: number
  finalOpacity?: number
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 500,
  delay = 0,
  style,
  initialOpacity = 0,
  finalOpacity = 1,
}) => {
  const opacity = new Animated.Value(initialOpacity)

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: finalOpacity,
      duration,
      delay,
      useNativeDriver: true,
    }).start()

    return () => {
      opacity.stopAnimation()
    }
  }, [])

  return (
    <Animated.View
      style={[
        {
          opacity,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}
