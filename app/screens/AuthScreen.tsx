"use client"

import { IMAGES } from "@/assets/images"
import * as AppleAuthentication from "expo-apple-authentication"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native"
import type React from "react"
import { useState } from "react"
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AnimatedButton } from "../components/AnimatedButton"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { Text } from "../components/Text"
import { socialAuth } from "../services/auth"
import { useTheme } from "../theme/theme"

const { width, height } = Dimensions.get("window")

export const AuthScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { useGoogleAuth } = socialAuth
  const { request, signInWithGoogle } = useGoogleAuth()

  // State
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Animation values
  const formPosition = useSharedValue(0)
  const logoScale = useSharedValue(1)

  // Toggle between sign in and sign up
  const toggleAuthMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsSignIn(!isSignIn)
    formPosition.value = withTiming(isSignIn ? 1 : 0, { duration: 400 })
    logoScale.value = withTiming(isSignIn ? 0.8 : 1, { duration: 400 })
  }

  // Handle sign in with Apple
  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await socialAuth.signInWithApple()
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sign in with Google
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await signInWithGoogle()
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Animated styles
  const formStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      formPosition.value,
      [0, 1],
      [0, -height * 0.1],
      Extrapolate.CLAMP,
    )

    return {
      transform: [{ translateY }],
    }
  })

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    }
  })

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[
          theme.dark ? "rgba(10, 132, 255, 0.1)" : "rgba(10, 132, 255, 0.05)",
          theme.dark ? "rgba(50, 215, 75, 0.1)" : "rgba(50, 215, 75, 0.05)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom || 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and App Name */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image source={IMAGES.logo} style={styles.logo} />
          <Text variant="header" style={styles.appName}>
            FitnessPro
          </Text>
          <Text variant="body" style={styles.tagline}>
            Your personal fitness companion
          </Text>
        </Animated.View>

        {/* Auth Form */}
        <Animated.View style={[styles.formContainer, formStyle]}>
          <GlassMorphicCard style={styles.formCard}>
            <Text variant="title" style={styles.formTitle}>
              {isSignIn ? "Welcome Back" : "Create Account"}
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text variant="caption" style={styles.inputLabel}>
                  Email
                </Text>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Lock size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text variant="caption" style={styles.inputLabel}>
                  Password
                </Text>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.input}
                />
              </View>
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.text.secondary} />
                ) : (
                  <Eye size={20} color={theme.colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <Text variant="caption" style={styles.errorText}>
                {error}
              </Text>
            ) : null}

            {/* Submit Button */}
            <AnimatedButton
              title={isSignIn ? "Sign In" : "Sign Up"}
              onPress={() => {}}
              icon={<ArrowRight size={20} color="#FFFFFF" />}
              size="large"
              isLoading={isLoading}
              style={styles.submitButton}
            />

            {/* Toggle Auth Mode */}
            <TouchableOpacity style={styles.toggleContainer} onPress={toggleAuthMode}>
              <Text variant="body" style={styles.toggleText}>
                {isSignIn ? "Don't have an account? " : "Already have an account? "}
                <Text variant="body" style={styles.toggleTextHighlight}>
                  {isSignIn ? "Sign Up" : "Sign In"}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text variant="caption" style={styles.dividerText}>
                OR
              </Text>
              <View style={styles.divider} />
            </View>

            {/* Social Sign In */}
            <View style={styles.socialContainer}>
              {/* Apple Sign In */}
              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={12}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              )}

              {/* Google Sign In */}
              {/* <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={!request}
              >
                <Image source={require("../../assets/images/logo.png")} style={styles.socialIcon} />
                <Text variant="button" style={styles.socialButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity> */}
            </View>
          </GlassMorphicCard>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  appleButton: {
    height: 50,
    marginBottom: 16,
    width: "100%",
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  divider: {
    backgroundColor: "rgba(150, 150, 150, 0.3)",
    flex: 1,
    height: 1,
  },
  dividerContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 24,
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.7,
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
  },
  eyeIcon: {
    padding: 4,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
  },
  formContainer: {
    maxWidth: 400,
    width: "100%",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(150, 150, 150, 0.3)",
    borderWidth: 1,
  },
  input: {
    backgroundColor: "transparent",
    border: "none",
    color: "#000000",
    fontSize: 16,
    outline: "none",
    padding: 0,
  },
  inputContainer: {
    alignItems: "center",
    borderBottomColor: "rgba(150, 150, 150, 0.3)",
    borderBottomWidth: 1,
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  inputWrapper: {
    flex: 1,
  },
  logo: {
    height: 100,
    marginBottom: 16,
    resizeMode: "contain",
    width: 100,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  scrollContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  socialButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
    marginBottom: 16,
    width: "100%",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  socialContainer: {
    alignItems: "center",
  },
  socialIcon: {
    height: 24,
    marginRight: 12,
    width: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  toggleContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  toggleText: {
    textAlign: "center",
  },
  toggleTextHighlight: {
    color: "#0A84FF",
    fontWeight: "bold",
  },
})
