"use client"

import { useEffect, useRef } from "react"
import { TouchableOpacity, Animated, StyleSheet } from "react-native"
import { X } from "lucide-react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface SnackbarProps {
  message: string
  action?: {
    label: string
    onPress: () => void
  }
  onClose?: () => void
  duration?: number
  visible: boolean
}

export const Snackbar = ({ message, action, onClose, duration = 4000, visible }: SnackbarProps) => {
  const theme = useTheme()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    if (visible) {
      // Show snackbar
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      // Auto hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose && onClose()
        }, duration)

        return () => clearTimeout(timer)
      }
    } else {
      // Hide snackbar
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, duration])

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.cardBackground,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="md">
        <Text flex={1} color="text">
          {message}
        </Text>

        <Box flexDirection="row" alignItems="center">
          {action && (
            <TouchableOpacity onPress={action.onPress} style={{ marginLeft: 16 }}>
              <Text color="primary" variant="button">
                {action.label}
              </Text>
            </TouchableOpacity>
          )}

          {onClose && (
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 8, padding: 4 }}>
              <X size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </Box>
      </Box>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
})
