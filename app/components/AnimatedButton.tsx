"use client"

import * as Haptics from "expo-haptics"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from "react-native"
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { useTheme } from "../theme/theme"

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"
type ButtonSize = "small" | "medium" | "large"

interface AnimatedButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  hapticFeedback?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
  icon,
  iconPosition = "left",
}) => {
  const theme = useTheme()
  const scale = useSharedValue(1)
  const backgroundColor = useSharedValue(0)

  const handlePress = () => {
    if (disabled || loading) return

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    scale.value = withSequence(
      withTiming(0.95, { duration: 100, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) }),
    )

    backgroundColor.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(100, withTiming(0, { duration: 200 })),
    )

    onPress()
  }

  const animatedStyle = useAnimatedStyle(() => {
    let baseColor, pressedColor, textColor, pressedTextColor, borderColor

    switch (variant) {
      case "primary":
        baseColor = theme.colors.primary
        pressedColor = theme.dark ? "#0071E3" : "#0062CC"
        textColor = theme.colors.text.inverse
        pressedTextColor = theme.colors.text.inverse
        borderColor = "transparent"
        break
      case "secondary":
        baseColor = theme.colors.secondary
        pressedColor = theme.dark ? "#28BD3D" : "#28A745"
        textColor = theme.colors.text.inverse
        pressedTextColor = theme.colors.text.inverse
        borderColor = "transparent"
        break
      case "outline":
        baseColor = "transparent"
        pressedColor = theme.dark ? "rgba(10, 132, 255, 0.1)" : "rgba(10, 132, 255, 0.1)"
        textColor = theme.colors.primary
        pressedTextColor = theme.colors.primary
        borderColor = theme.colors.primary
        break
      case "ghost":
        baseColor = "transparent"
        pressedColor = theme.dark ? "rgba(142, 142, 147, 0.1)" : "rgba(142, 142, 147, 0.1)"
        textColor = theme.colors.text.primary
        pressedTextColor = theme.colors.text.primary
        borderColor = "transparent"
        break
    }

    if (disabled) {
      baseColor = theme.dark ? "rgba(142, 142, 147, 0.3)" : "rgba(142, 142, 147, 0.3)"
      textColor = theme.dark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"
      borderColor = "transparent"
    }

    const currentBgColor = interpolateColor(
      backgroundColor.value,
      [0, 1],
      [baseColor, pressedColor],
    )

    return {
      backgroundColor: currentBgColor,
      borderColor,
      transform: [{ scale: scale.value }],
    }
  })

  const getButtonSize = () => {
    switch (size) {
      case "small":
        return styles.buttonSmall
      case "large":
        return styles.buttonLarge
      default:
        return styles.buttonMedium
    }
  }

  const getTextSize = () => {
    switch (size) {
      case "small":
        return styles.textSmall
      case "large":
        return styles.textLarge
      default:
        return styles.textMedium
    }
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[
        styles.button,
        getButtonSize(),
        { borderWidth: variant === "outline" ? 1 : 0 },
        animatedStyle,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text.inverse} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text
            style={[
              styles.text,
              getTextSize(),
              {
                color:
                  variant === "primary" || variant === "secondary"
                    ? theme.colors.text.inverse
                    : variant === "outline"
                      ? theme.colors.primary
                      : theme.colors.text.primary,
                marginLeft: icon && iconPosition === "left" ? 8 : 0,
                marginRight: icon && iconPosition === "right" ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonLarge: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonMedium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  textLarge: {
    fontSize: 18,
  },
  textMedium: {
    fontSize: 16,
  },
  textSmall: {
    fontSize: 14,
  },
})
