"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { TouchableOpacity, StyleSheet, type ViewStyle, Animated, Easing } from "react-native"
import { Mic, Loader } from "lucide-react-native"
import { useTheme } from "@/hooks/useTheme"
import { VoiceVisualization } from "./VoiceVisualization"

export interface VoiceButtonProps {
  onPress?: () => void
  onLongPress?: () => void
  isListening?: boolean
  isProcessing?: boolean
  disabled?: boolean
  size?: number
  style?: ViewStyle
  visualizationType?: "wave" | "bars" | "circle" | "dots" | "pulse"
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress,
  onLongPress,
  isListening = false,
  isProcessing = false,
  disabled = false,
  size = 60,
  style,
  visualizationType = "circle",
}) => {
  const { colors } = useTheme()
  const [pulseAnim] = useState(new Animated.Value(1))

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }

    return () => {
      pulseAnim.stopAnimation()
    }
  }, [isListening])

  // Render icon based on state
  const renderIcon = () => {
    if (isProcessing) {
      return <Loader size={size / 2} color="#FFFFFF" />
    }

    if (isListening) {
      return <Mic size={size / 2} color="#FFFFFF" />
    }

    return <Mic size={size / 2} color="#FFFFFF" />
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: disabled ? colors.border : isListening ? colors.error : colors.primary,
        },
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled || isProcessing}
      activeOpacity={0.7}
    >
      {/* Pulse effect */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulse,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.error,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Icon */}
      {renderIcon()}

      {/* Voice visualization overlay when listening */}
      {isListening && (
        <VoiceVisualization
          type={visualizationType}
          color="rgba(255, 255, 255, 0.5)"
          active={isListening}
          style={styles.visualization}
        />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
  },
  pulse: {
    position: "absolute",
    opacity: 0.3,
  },
  visualization: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
