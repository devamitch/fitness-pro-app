"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"

export interface TypingAnimationProps {
  text: string
  speed?: number // milliseconds per character
  delay?: number // initial delay in milliseconds
  onComplete?: () => void
  style?: ViewStyle
  textVariant?: "body" | "title" | "subtitle" | "caption" | "header" | "button"
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50,
  delay = 0,
  onComplete,
  style,
  textVariant = "body",
}) => {
  const { colors } = useTheme()
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  useEffect(() => {
    if (currentIndex === 0) {
      // Initial delay
      const initialTimeout = setTimeout(() => {
        if (text.length > 0) {
          setDisplayedText(text.charAt(0))
          setCurrentIndex(1)
        } else {
          setIsComplete(true)
        }
      }, delay)

      return () => clearTimeout(initialTimeout)
    }

    if (currentIndex < text.length) {
      // Type next character
      const timeout = setTimeout(() => {
        setDisplayedText(text.substring(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (!isComplete) {
      // Animation complete
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
    }
  }, [currentIndex, text, speed, delay, isComplete])

  return (
    <View style={[styles.container, style]}>
      <Text variant={textVariant}>{displayedText}</Text>
      {currentIndex < text.length && (
        <View
          style={[
            styles.cursor,
            {
              backgroundColor: colors.text,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  cursor: {
    width: 2,
    height: 16,
    marginLeft: 2,
  },
})
