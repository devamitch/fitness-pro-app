"use client"

import {
  BlurMask,
  Canvas,
  Circle,
  DisplacementMap,
  Fill,
  Group,
  Path,
  RoundedRect,
  Shadow,
  Skia,
  Text as SkiaText,
  SweepGradient,
  Turbulence,
  useClockValue,
  useComputedValue,
  useFont,
  useValue,
  vec,
} from "@shopify/react-native-skia"
import * as AppleAuthentication from "expo-apple-authentication"
import * as AuthSession from "expo-auth-session"
import * as Haptics from "expo-haptics"
import * as WebBrowser from "expo-web-browser"
import { Linkedin, Spotify, X } from "lucide-react-native"
import type React from "react"
import { useEffect, useState } from "react"
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { socialAuth } from "../services/auth"
import { useTheme } from "../theme/theme"
import { identifyUser, trackEvent, trackScreen } from "../utils/analytics"

// Ensure auth redirects work properly
WebBrowser.maybeCompleteAuthSession()

const { width, height } = Dimensions.get("window")

export const EnhancedAuthScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { useGoogleAuth } = socialAuth
  const { request: googleRequest, signInWithGoogle } = useGoogleAuth()

  // Track screen view
  useEffect(() => {
    trackScreen("Auth Screen")
  }, [])

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Animation values
  const logoScale = useSharedValue(1)
  const backgroundIntensity = useSharedValue(0)

  // Skia animation values
  const clock = useClockValue()
  const centerX = useValue(width / 2)
  const centerY = useValue(height / 3)
  const font = useFont(require("../assets/fonts/Inter-Bold.ttf"), 32)

  // Handle sign in with Apple
  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      trackEvent("Auth Attempt", { method: "apple" })

      const result = await socialAuth.signInWithApple()
      if (result?.user) {
        identifyUser(result.user.id, {
          email: result.user.email,
          name: result.user.username,
          auth_method: "apple",
        })
        trackEvent("Auth Success", { method: "apple" })
      }
    } catch (error) {
      setError(error.message)
      trackEvent("Auth Error", { method: "apple", error: error.message })
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

      trackEvent("Auth Attempt", { method: "google" })

      const result = await signInWithGoogle()
      if (result?.user) {
        identifyUser(result.user.id, {
          email: result.user.email,
          name: result.user.username,
          auth_method: "google",
        })
        trackEvent("Auth Success", { method: "google" })
      }
    } catch (error) {
      setError(error.message)
      trackEvent("Auth Error", { method: "google", error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sign in with X/Twitter
  const handleXSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      trackEvent("Auth Attempt", { method: "twitter" })

      // Twitter OAuth configuration
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true })
      const authUrl = `https://your-auth-server.com/twitter-auth?redirect_uri=${encodeURIComponent(redirectUri)}`

      const result = await AuthSession.startAsync({ authUrl })

      if (result.type === "success") {
        // Process the result
        const { user } = result.params
        if (user) {
          identifyUser(user.id, {
            username: user.username,
            auth_method: "twitter",
          })
          trackEvent("Auth Success", { method: "twitter" })
        }
      }
    } catch (error) {
      setError(error.message)
      trackEvent("Auth Error", { method: "twitter", error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sign in with Spotify
  const handleSpotifySignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      trackEvent("Auth Attempt", { method: "spotify" })

      // Spotify OAuth configuration
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true })
      const spotifyClientId = "YOUR_SPOTIFY_CLIENT_ID"

      const authUrl = `https://accounts.spotify.com/authorize?client_id=${spotifyClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-private%20user-read-email`

      const result = await AuthSession.startAsync({ authUrl })

      if (result.type === "success") {
        // Exchange code for token on your backend
        const { code } = result.params
        // Call your backend to exchange code for token

        // Mock successful auth
        const mockUser = {
          id: "spotify_user_id",
          email: "user@example.com",
          username: "SpotifyUser",
        }
        identifyUser(mockUser.id, {
          email: mockUser.email,
          name: mockUser.username,
          auth_method: "spotify",
        })
        trackEvent("Auth Success", { method: "spotify" })
      }
    } catch (error) {
      setError(error.message)
      trackEvent("Auth Error", { method: "spotify", error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sign in with Discord
  const handleDiscordSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      trackEvent("Auth Attempt", { method: "discord" })

      // Discord OAuth configuration
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true })
      const discordClientId = "YOUR_DISCORD_CLIENT_ID"

      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify%20email`

      const result = await AuthSession.startAsync({ authUrl })

      if (result.type === "success") {
        // Exchange code for token on your backend
        const { code } = result.params
        // Call your backend to exchange code for token

        // Mock successful auth
        const mockUser = {
          id: "discord_user_id",
          email: "user@example.com",
          username: "DiscordUser",
        }
        identifyUser(mockUser.id, {
          email: mockUser.email,
          name: mockUser.username,
          auth_method: "discord",
        })
        trackEvent("Auth Success", { method: "discord" })
      }
    } catch (error) {
      setError(error.message)
      trackEvent("Auth Error", { method: "discord", error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sign in with LinkedIn
  const handleLinkedInSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      trackEvent("Auth Attempt", { method: "linkedin" })

      // LinkedIn OAuth configuration
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true })
      const linkedInClientId = "YOUR_LINKEDIN_CLIENT_ID"

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedInClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile%20r_emailaddress`

      const result = await AuthSession.startAsync({ authUrl })

      if (result.type === "success") {
        // Exchange code for token on your backend
        const { code } = result.params
        // Call your backend to exchange code for token

        // Mock successful auth
        const mockUser = {
          id: "linkedin_user_id",
          email: "user@example.com",
          username: "LinkedInUser",
        }
        identifyUser(mockUser.id, {
          email: mockUser.email,
          name: mockUser.username,
          auth_method: "linkedin",
        })
        trackEvent("Auth Success", { method: "linkedin" })
      }
    } catch (error) {
      setError(error.message)
      trackEvent("Auth Error", { method: "linkedin", error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Animated background paths
  const animatedPath1 = useComputedValue(() => {
    const time = (clock.current / 1000) % 10

    const path = Skia.Path.Make()

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time
      const x = centerX.current + Math.cos(angle) * (width * 0.4 + Math.sin(time + i) * 50)
      const y = centerY.current + Math.sin(angle) * (width * 0.4 + Math.cos(time + i) * 50)

      if (i === 0) {
        path.moveTo(x, y)
      } else {
        path.lineTo(x, y)
      }
    }

    path.close()
    return path
  }, [clock])

  const animatedPath2 = useComputedValue(() => {
    const time = (clock.current / 1000) % 10

    const path = Skia.Path.Make()

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - time * 0.5
      const x = centerX.current + Math.cos(angle) * (width * 0.3 + Math.sin(time * 0.7 + i) * 40)
      const y = centerY.current + Math.sin(angle) * (width * 0.3 + Math.cos(time * 0.7 + i) * 40)

      if (i === 0) {
        path.moveTo(x, y)
      } else {
        path.quadTo(
          centerX.current + Math.cos(angle - 0.2) * width * 0.4,
          centerY.current + Math.sin(angle - 0.2) * width * 0.4,
          x,
          y,
        )
      }
    }

    path.close()
    return path
  }, [clock])

  // Animated styles
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
      {/* Animated Background with Skia */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={theme.dark ? "#121214" : "#F8F9FA"} />

        <Group blendMode="multiply" opacity={0.6}>
          <Path path={animatedPath1}>
            <SweepGradient
              c={vec(centerX.current, centerY.current)}
              colors={
                theme.dark ? ["#4A00E0", "#8E2DE2", "#4A00E0"] : ["#8E2DE2", "#4A00E0", "#8E2DE2"]
              }
            />
            <BlurMask blur={30} style="normal" />
          </Path>
        </Group>

        <Group blendMode="multiply" opacity={0.4}>
          <Path path={animatedPath2}>
            <SweepGradient
              c={vec(centerX.current, centerY.current)}
              colors={
                theme.dark ? ["#0A84FF", "#32D74B", "#0A84FF"] : ["#32D74B", "#0A84FF", "#32D74B"]
              }
            />
            <BlurMask blur={40} style="normal" />
          </Path>
        </Group>

        <Group>
          <DisplacementMap channelX="r" channelY="b" scale={10}>
            <Turbulence freqX={0.01} freqY={0.01} octaves={2} seed={1} />
            <Fill color="rgba(255, 255, 255, 0.05)" />
          </DisplacementMap>
        </Group>

        {font && (
          <Group opacity={0.07} transform={[{ translateX: -150 }, { translateY: height * 0.4 }]}>
            <SkiaText
              x={0}
              y={0}
              text="FITNESS PRO"
              font={font}
              transform={[{ scale: 2 }, { rotate: Math.PI / 12 }]}
            >
              <BlurMask blur={2} style="normal" />
            </SkiaText>
          </Group>
        )}
      </Canvas>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom || 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and App Name */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Canvas style={styles.logoCanvas}>
            <Group>
              <RoundedRect x={0} y={0} width={100} height={100} r={30}>
                <SweepGradient c={vec(50, 50)} colors={["#0A84FF", "#32D74B", "#0A84FF"]} />
                <Shadow dx={0} dy={4} blur={15} color="rgba(0, 0, 0, 0.2)" />
              </RoundedRect>

              {font && (
                <SkiaText
                  x={50}
                  y={55}
                  text="FP"
                  font={font}
                  color="#FFFFFF"
                  opacity={0.9}
                  origin={vec(50, 50)}
                />
              )}
            </Group>
          </Canvas>

          <Text variant="header" style={styles.appName}>
            FitnessPro
          </Text>
          <Text variant="body" style={styles.tagline}>
            Your personal fitness companion
          </Text>
        </Animated.View>

        {/* Social Sign In */}
        <View style={styles.socialContainer}>
          <Text variant="title" style={styles.socialTitle}>
            Sign in to continue
          </Text>

          {/* Error Message */}
          {error ? (
            <Text variant="caption" style={styles.errorText}>
              {error}
            </Text>
          ) : null}

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
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={!googleRequest || isLoading}
          >
            <View style={styles.socialIconContainer}>
              <Canvas style={styles.socialIconCanvas}>
                <Circle cx={12} cy={12} r={12} color="#FFFFFF" />
                <Group>
                  <RoundedRect x={2} y={2} width={20} height={20} r={10} color="#FFFFFF">
                    <Shadow dx={0} dy={1} blur={2} color="rgba(0, 0, 0, 0.1)" />
                  </RoundedRect>
                </Group>
              </Canvas>
            </View>
            <Text variant="button" style={styles.socialButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* X/Twitter Sign In */}
          <TouchableOpacity
            style={[styles.socialButton, styles.xButton]}
            onPress={handleXSignIn}
            disabled={isLoading}
          >
            <X size={20} color="#FFFFFF" style={styles.socialIcon} />
            <Text variant="button" style={[styles.socialButtonText, { color: "#FFFFFF" }]}>
              Continue with X
            </Text>
          </TouchableOpacity>

          {/* Spotify Sign In */}
          <TouchableOpacity
            style={[styles.socialButton, styles.spotifyButton]}
            onPress={handleSpotifySignIn}
            disabled={isLoading}
          >
            <Spotify size={20} color="#FFFFFF" style={styles.socialIcon} />
            <Text variant="button" style={[styles.socialButtonText, { color: "#FFFFFF" }]}>
              Continue with Spotify
            </Text>
          </TouchableOpacity>

          {/* Discord Sign In */}
          <TouchableOpacity
            style={[styles.socialButton, styles.discordButton]}
            onPress={handleDiscordSignIn}
            disabled={isLoading}
          >
            <Text variant="button" style={[styles.socialButtonText, { color: "#FFFFFF" }]}>
              Continue with Discord
            </Text>
          </TouchableOpacity>

          {/* LinkedIn Sign In */}
          <TouchableOpacity
            style={[styles.socialButton, styles.linkedinButton]}
            onPress={handleLinkedInSignIn}
            disabled={isLoading}
          >
            <Linkedin size={20} color="#FFFFFF" style={styles.socialIcon} />
            <Text variant="button" style={[styles.socialButtonText, { color: "#FFFFFF" }]}>
              Continue with LinkedIn
            </Text>
          </TouchableOpacity>

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text variant="caption" style={styles.loadingText}>
                Authenticating...
              </Text>
            </View>
          )}

          {/* Terms and Privacy */}
          <Text variant="caption" style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text variant="caption" style={styles.termsLink}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text variant="caption" style={styles.termsLink}>
              Privacy Policy
            </Text>
          </Text>
        </View>
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
  discordButton: {
    backgroundColor: "#5865F2",
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(150, 150, 150, 0.3)",
    borderWidth: 1,
  },
  linkedinButton: {
    backgroundColor: "#0077B5",
  },
  loadingContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  loadingText: {
    color: "rgba(150, 150, 150, 0.8)",
  },
  logoCanvas: {
    height: 100,
    marginBottom: 16,
    width: 100,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  scrollContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "space-between",
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
    marginBottom: 20,
    maxWidth: 400,
    width: "100%",
  },
  socialIcon: {
    marginRight: 12,
  },
  socialIconCanvas: {
    height: 24,
    width: 24,
  },
  socialIconContainer: {
    height: 24,
    marginRight: 12,
    width: 24,
  },
  socialTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  spotifyButton: {
    backgroundColor: "#1DB954",
  },
  tagline: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  termsLink: {
    color: "#0A84FF",
    fontWeight: "500",
  },
  termsText: {
    lineHeight: 20,
    marginTop: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  xButton: {
    backgroundColor: "#000000",
  },
})
