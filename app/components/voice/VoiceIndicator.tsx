"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, Animated, Easing, type ViewStyle } from "react-native"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"

export interface VoiceIndicatorProps {
  isListening?: boolean
  text?: string
  style?: ViewStyle
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  isListening = false,
  text = "Listening...",
  style,
}) => {
  const { colors } = useTheme()
  const [dotAnimation] = useState(new Animated.Value(0))

  // Animate dots when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.timing(dotAnimation, {
          toValue: 3,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ).start()
    } else {
      dotAnimation.setValue(0)
    }

    return () => {
      dotAnimation.stopAnimation()
    }
  }, [isListening])

  // Generate dots based on animation value
  const dots = Animated.add(dotAnimation, 0).interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["", ".", "..", "..."],
  })

  if (!isListening) {
    return null
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.indicator}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: colors.error,
            },
          ]}
        />
      </View>
      <Text variant="body">
        {text}
        <Animated.Text>{dots}</Animated.Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  indicator: {
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
