"use client"

import type React from "react"
import { useEffect } from "react"
import { Animated, type ViewStyle } from "react-native"

export type SlideDirection = "up" | "down" | "left" | "right"

export interface SlideInViewProps {
  children: React.ReactNode
  direction?: SlideDirection
  distance?: number
  duration?: number
  delay?: number
  style?: ViewStyle
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = "up",
  distance = 100,
  duration = 500,
  delay = 0,
  style,
}) => {
  // Create animation value based on direction
  const getInitialTranslation = () => {
    switch (direction) {
      case "up":
        return { translateY: new Animated.Value(distance) }
      case "down":
        return { translateY: new Animated.Value(-distance) }
      case "left":
        return { translateX: new Animated.Value(distance) }
      case "right":
        return { translateX: new Animated.Value(-distance) }
    }
  }

  const translation = getInitialTranslation()
  const animatedValue = Object.values(translation)[0]

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start()

    return () => {
      animatedValue.stopAnimation()
    }
  }, [])

  return (
    <Animated.View
      style={[
        {
          transform: [
            Object.keys(translation)[0] === "translateY"
              ? { translateY: animatedValue }
              : { translateX: animatedValue },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}
