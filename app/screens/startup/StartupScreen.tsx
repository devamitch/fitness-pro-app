"use client"

import { useEffect } from "react"
import { StyleSheet, Dimensions } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { Box } from "../../components/ui/layout/Box"
import { MoonlightText } from "../../components/ui/typography/MoonlightText"
import { Text } from "../../components/ui/typography/Text"
import { useTheme } from "../../theme"

const { width } = Dimensions.get("window")

export const StartupScreen = () => {
  const theme = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  // Set up animations
  useEffect(() => {
    // Fade in and slide up
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    translateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) })

    // Pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [])

  // Animated styles
  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }
  })

  return (
    <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="background">
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <MoonlightText style={styles.logo}>FitTrack</MoonlightText>
      </Animated.View>

      <Animated.View style={textStyle}>
        <Text variant="subtitle" color="textInverted" style={styles.tagline}>
          Your Personal Fitness Journey
        </Text>
      </Animated.View>
    </Box>
  )
}

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    fontSize: 48,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  tagline: {
    textAlign: "center",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 5,
  },
})
