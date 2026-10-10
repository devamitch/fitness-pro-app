"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"
import { TypingAnimation } from "./TypingAnimation"

export interface AITextGeneratorProps {
  prompt?: string
  responseText?: string
  isGenerating?: boolean
  typingSpeed?: number
  style?: ViewStyle
  textVariant?: "body" | "title" | "subtitle" | "caption" | "header" | "button"
  onComplete?: () => void
}

export const AITextGenerator: React.FC<AITextGeneratorProps> = ({
  prompt,
  responseText,
  isGenerating = false,
  typingSpeed = 30,
  style,
  textVariant = "body",
  onComplete,
}) => {
  const { colors } = useTheme()
  const [displayText, setDisplayText] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [dots, setDots] = useState("")

  // Simulate thinking with dots animation
  useEffect(() => {
    if (isGenerating && !responseText) {
      setIsThinking(true)

      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) {
            return ""
          }
          return prev + "."
        })
      }, 500)

      return () => {
        clearInterval(interval)
        setIsThinking(false)
      }
    } else {
      setIsThinking(false)
    }
  }, [isGenerating, responseText])

  // Set response text when available
  useEffect(() => {
    if (responseText) {
      setDisplayText(responseText)
    }
  }, [responseText])

  return (
    <View style={[styles.container, style]}>
      {prompt && (
        <View style={styles.promptContainer}>
          <Text variant="subtitle" style={{ color: colors.primary }}>
            You
          </Text>
          <Text variant={textVariant} style={styles.promptText}>
            {prompt}
          </Text>
        </View>
      )}

      <View style={styles.responseContainer}>
        <Text variant="subtitle" style={{ color: colors.secondary }}>
          AI Assistant
        </Text>

        {isThinking ? (
          <Text variant={textVariant} style={{ color: colors.textSecondary }}>
            Thinking{dots}
          </Text>
        ) : responseText ? (
          <TypingAnimation text={responseText} speed={typingSpeed} textVariant={textVariant} onComplete={onComplete} />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  promptContainer: {
    marginBottom: 16,
  },
  promptText: {
    marginTop: 4,
  },
  responseContainer: {
    marginBottom: 16,
  },
})
