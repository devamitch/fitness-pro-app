"use client"

import { useCallback, useEffect } from "react"
import { Image, StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { useAuthStore } from "../stores/authStore"
// import { initTensorFlow } from "../services/mediaPipe"
import { IMAGES } from "@/assets/images"
import { supabase } from "../services/api"

export const SplashScreen = () => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const { setInitialized } = useAuthStore()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }
  })

  const initialize = useCallback(async () => {
    try {
      // Initialize TensorFlow.js
      // await initTensorFlow()

      // Check if user is already logged in
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        useAuthStore.getState().setUser({
          id: data.session.user.id,
          email: data.session.user.email || "",
          username: data.session.user.user_metadata.username || "",
          avatarUrl: data.session.user.user_metadata.avatar_url,
        })
        useAuthStore.getState().setToken(data.session.access_token)
      }

      // Mark as initialized
      setInitialized(true)
    } catch (error) {
      console.error("Initialization error:", error)
      setInitialized(true) // Continue anyway
    }
  }, [setInitialized])

  useEffect(() => {
    // Start animation
    opacity.value = withSequence(
      withTiming(1, { duration: 800, easing: Easing.ease }),
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 800, easing: Easing.ease }),
    )

    scale.value = withSequence(
      withTiming(1.1, { duration: 800, easing: Easing.ease }),
      withTiming(1, { duration: 200, easing: Easing.ease }),
      withTiming(1, { duration: 800 }),
      withTiming(1.2, { duration: 800, easing: Easing.ease }),
    )

    // Initialize app
    setTimeout(() => {
      runOnJS(initialize)()
    }, 1000)
  }, [initialize, opacity, scale])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image source={IMAGES.logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0A84FF",
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    height: 200,
    width: 200,
  },
  logoContainer: {
    alignItems: "center",
  },
})
