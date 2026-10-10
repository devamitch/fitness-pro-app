"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from "react-native-reanimated"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"

interface AnimatedInstructionsProps {
  text: string
  style?: ViewStyle
  duration?: number
}

const AnimatedInstructions: React.FC<AnimatedInstructionsProps> = ({ text, style, duration = 5000 }) => {
  const { theme } = useTheme()
  const [currentText, setCurrentText] = useState(text)
  const [previousText, setPreviousText] = useState("")

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const scale = useSharedValue(0.95)

  // Update text with animation
  useEffect(() => {
    if (text !== currentText) {
      // Store previous text
      setPreviousText(currentText)

      // Animate out
      opacity.value = withTiming(0, { duration: 300 })
      translateY.value = withTiming(-10, { duration: 300 }, () => {
        // Update text
        setCurrentText(text)

        // Animate in
        translateY.value = 20
        opacity.value = withTiming(1, { duration: 300 })
        translateY.value = withTiming(0, { duration: 300 })
        scale.value = withSequence(withTiming(1.05, { duration: 150 }), withTiming(1, { duration: 150 }))
      })
    } else if (opacity.value === 0) {
      // Initial animation
      opacity.value = withTiming(1, { duration: 500 })
      translateY.value = withTiming(0, { duration: 500 })
      scale.value = withSequence(withTiming(1.05, { duration: 250 }), withTiming(1, { duration: 250 }))
    }
  }, [text])

  // Auto-hide after duration
  useEffect(() => {
    const hideTimeout = setTimeout(() => {
      opacity.value = withTiming(0.7, { duration: 500 })
    }, duration)

    return () => clearTimeout(hideTimeout)
  }, [text, duration])

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }
  })

  // Previous text animated style
  const previousTextStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - opacity.value,
      transform: [{ translateY: -10 - translateY.value }, { scale: 0.95 }],
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    }
  })

  return (
    <View style={[styles.container, style]}>
      {previousText && (
        <Animated.View style={[styles.textContainer, previousTextStyle]}>
          <Text style={[styles.text, { color: theme.colors.text }]}>{previousText}</Text>
        </Animated.View>
      )}

      <Animated.View style={[styles.textContainer, animatedStyle]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>{currentText}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    justifyContent: "center",
    overflow: "hidden",
  },
  textContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
})

export default AnimatedInstructions
