"use client"

import React from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated"

const { width, height } = Dimensions.get("window")

interface AnimatedOrbsProps {
  children: React.ReactNode
}

export const AnimatedOrbs: React.FC<AnimatedOrbsProps> = ({ children }) => {
  const orb1X = useSharedValue(0)
  const orb1Y = useSharedValue(0)
  const orb2X = useSharedValue(0)
  const orb2Y = useSharedValue(0)

  // Animation configuration
  const animationConfig = {
    duration: 5000, // Adjusted duration for slower movement
    easing: Easing.inOut(Easing.ease),
  }

  // Animate the orbs
  const animateOrb = (x: Animated.SharedValue<number>, y: Animated.SharedValue<number>) => {
    x.value = withTiming(Math.random() * width, animationConfig, () => {
      x.value = 0 // Reset to left edge for continuous animation
      animateOrb(x, y)
    })
    y.value = withTiming(Math.random() * height, animationConfig)
  }

  // Start animations on mount
  React.useEffect(() => {
    animateOrb(orb1X, orb1Y)
    animateOrb(orb2X, orb2Y)
  }, [])

  // Animated styles
  const animatedOrb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }))

  const animatedOrb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }))

  return (
    <View style={styles.container}>
      {/* Orb 1 */}
      <Animated.View style={[styles.orb, styles.orb1, animatedOrb1Style]} />

      {/* Orb 2 */}
      <Animated.View style={[styles.orb, styles.orb2, animatedOrb2Style]} />

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.6,
    backgroundColor: "rgba(10, 132, 255, 0.2)", // Light blue color
  },
  orb1: {
    top: "20%",
    left: "-10%",
  },
  orb2: {
    bottom: "10%",
    right: "-20%",
    backgroundColor: "rgba(50, 215, 75, 0.2)", // Light green color
  },
})
