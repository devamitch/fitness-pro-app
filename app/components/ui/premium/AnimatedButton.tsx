"use client"

import type { ReactNode } from "react"
import { TouchableOpacity, ActivityIndicator } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import type { Theme } from "../../../theme/theme"

type AnimationType = "scale" | "pulse" | "bounce"

export interface AnimatedButtonProps {
  title: string
  onPress: () => void
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "small" | "medium" | "large"
  disabled?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  animationType?: AnimationType
  color?: keyof Theme["colors"]
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export const AnimatedButton = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  animationType = "scale",
  color,
}: AnimatedButtonProps) => {
  const theme = useTheme()
  const scale = useSharedValue(1)

  // Handle press in
  const handlePressIn = () => {
    switch (animationType) {
      case "scale":
        scale.value = withTiming(0.95, { duration: 100 })
        break
      case "bounce":
      case "pulse":
        scale.value = withTiming(0.95, { duration: 100 })
        break
    }
  }

  // Handle press out
  const handlePressOut = () => {
    switch (animationType) {
      case "scale":
        scale.value = withTiming(1, { duration: 200 })
        break
      case "bounce":
        scale.value = withSequence(withTiming(1.05, { duration: 100 }), withSpring(1, { damping: 15, stiffness: 150 }))
        break
      case "pulse":
        scale.value = withTiming(1, { duration: 200 })
        break
    }
  }

  // Get size properties
  const getSizeProps = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: "xs",
          paddingHorizontal: "sm",
          fontSize: 14,
        }
      case "large":
        return {
          paddingVertical: "md",
          paddingHorizontal: "lg",
          fontSize: 18,
        }
      case "medium":
      default:
        return {
          paddingVertical: "sm",
          paddingHorizontal: "md",
          fontSize: 16,
        }
    }
  }

  // Get variant properties
  const getVariantProps = () => {
    const buttonColor = color || "primary"

    switch (variant) {
      case "secondary":
        return {
          backgroundColor: "secondary",
          textColor: "white",
        }
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: buttonColor,
          textColor: buttonColor,
        }
      case "ghost":
        return {
          backgroundColor: "transparent",
          textColor: buttonColor,
        }
      case "primary":
      default:
        return {
          backgroundColor: buttonColor,
          textColor: "white",
        }
    }
  }

  const sizeProps = getSizeProps()
  const variantProps = getVariantProps()

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  // Start pulse animation if needed
  if (animationType === "pulse" && !disabled && !loading) {
    const startPulse = () => {
      scale.value = withSequence(
        withTiming(1.05, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400 }),
        withTiming(1, { duration: 0 }, () => {
          runOnJS(startPulse)()
        }),
      )
    }

    startPulse()
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[animatedStyle]}
    >
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        paddingVertical={sizeProps.paddingVertical}
        paddingHorizontal={sizeProps.paddingHorizontal}
        backgroundColor={disabled ? "buttonDisabled" : variantProps.backgroundColor}
        borderWidth={variantProps.borderWidth || 0}
        borderColor={variantProps.borderColor}
        borderRadius="md"
        opacity={disabled ? 0.5 : 1}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors[variantProps.textColor]} />
        ) : (
          <>
            {leftIcon && <Box marginRight="xs">{leftIcon}</Box>}
            <Text color={variantProps.textColor} style={{ fontSize: sizeProps.fontSize, fontWeight: "600" }}>
              {title}
            </Text>
            {rightIcon && <Box marginLeft="xs">{rightIcon}</Box>}
          </>
        )}
      </Box>
    </AnimatedTouchable>
  )
}
