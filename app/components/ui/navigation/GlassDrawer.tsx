"use client"

import { DrawerContentScrollView, type DrawerContentComponentProps } from "@react-navigation/drawer"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import React, { useCallback } from "react"
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuthStore } from "../../../stores/authStore"
import { useTheme } from "../../../theme"
import { Text } from "../typography/Text"

const { width } = Dimensions.get("window")

export const GlassDrawer: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuthStore()

  // Animation values
  const drawerProgress = useSharedValue(0)
  const itemsProgress = useSharedValue(0)

  // Update drawer progress when drawer state changes
  React.useEffect(() => {
    if (props.state.history.length > 1) {
      drawerProgress.value = withTiming(1, { duration: 400 })
      itemsProgress.value = withTiming(1, { duration: 600 })
    } else {
      drawerProgress.value = withTiming(0, { duration: 400 })
      itemsProgress.value = withTiming(0, { duration: 200 })
    }
  }, [props.state])

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(drawerProgress.value, [0, 1], [-100, 0], Extrapolate.CLAMP)
    const opacity = interpolate(drawerProgress.value, [0, 0.5, 1], [0, 0.5, 1], Extrapolate.CLAMP)

    return {
      transform: [{ translateX }],
      opacity,
    }
  })

  // Handle navigation
  const navigateTo = useCallback(
    (routeName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      navigation.navigate(routeName)
    },
    [navigation],
  )

  // Handle sign out
  const handleSignOut = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    signOut()
    navigation.navigate("Auth")
  }, [navigation, signOut])

  // Get active route name
  const activeRouteName = state.routes[state.index].name

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={[
          theme.isDarkMode ? "rgba(10, 132, 255, 0.1)" : "rgba(10, 132, 255, 0.05)",
          theme.isDarkMode ? "rgba(50, 215, 75, 0.1)" : "rgba(50, 215, 75, 0.05)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Blur effect */}
      <BlurView
        intensity={theme.isDarkMode ? 40 : 60}
        tint={theme.isDarkMode ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, containerStyle, { paddingTop: insets.top }]}>
        {/* User Profile */}
        <View style={styles.profileCard}>
          <BlurView
            intensity={theme.isDarkMode ? 20 : 40}
            tint={theme.isDarkMode ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.profileHeader}>
            <Image
              source={
                user?.avatarUrl
                  ? { uri: user.avatarUrl }
                  : require("../../../../assets/images/logo.png")
              }
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="title" style={styles.username}>
                {user?.username || "Guest User"}
              </Text>
              <Text variant="caption" style={styles.email}>
                {user?.email || "Sign in to sync your progress"}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={styles.navigationContainer}>
          {props.state.routes.map((route, index) => {
            const isActive = index === state.index

            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.drawerItem,
                  isActive && {
                    backgroundColor: theme.isDarkMode
                      ? "rgba(10, 132, 255, 0.1)"
                      : "rgba(10, 132, 255, 0.05)",
                  },
                ]}
                onPress={() => navigateTo(route.name)}
              >
                <Text
                  variant="subtitle"
                  style={[styles.drawerItemLabel, isActive && { color: theme.colors.primary }]}
                >
                  {route.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.divider} />

        {/* Sign Out */}
        {user && (
          <TouchableOpacity style={styles.drawerItem} onPress={handleSignOut}>
            <Text
              variant="subtitle"
              style={[styles.drawerItemLabel, { color: theme.colors.error }]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        )}

        {/* App Version */}
        <Text variant="caption" style={styles.versionText}>
          Version 1.0.0
        </Text>
      </Animated.View>
    </DrawerContentScrollView>
  )
}

const styles = StyleSheet.create({
  avatar: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    width: 60,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  divider: {
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    height: 1,
    marginVertical: 16,
  },
  drawerItem: {
    borderRadius: 12,
    marginHorizontal: 0,
    marginVertical: 4,
    padding: 12,
  },
  drawerItemLabel: {
    fontWeight: "500",
  },
  email: {
    opacity: 0.7,
  },
  navigationContainer: {
    marginBottom: 16,
  },
  profileCard: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
    padding: 16,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontWeight: "bold",
  },
  versionText: {
    marginTop: 16,
    opacity: 0.5,
    textAlign: "center",
  },
})
