"use client"

import { IMAGES } from "@/assets/images"
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import {
  Award,
  Bell,
  Compass,
  Dumbbell,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  Moon,
  Settings,
  Share2,
  Sun,
  User,
} from "lucide-react-native"
import React, { useCallback } from "react"
import { Dimensions, Image, StyleSheet, View } from "react-native"
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuthStore } from "../stores/authStore"
import { useTheme } from "../theme/theme"
import { GlassMorphicCard } from "./GlassMorphicCard"
import { Text } from "./Text"

const { width } = Dimensions.get("window")

export const CustomDrawer: React.FC<DrawerContentComponentProps> = (props) => {
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
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
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

      <Animated.View style={[styles.content, containerStyle, { paddingTop: insets.top }]}>
        {/* User Profile */}
        <GlassMorphicCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={user?.avatarUrl ? { uri: user.avatarUrl } : IMAGES.logo}
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

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Award size={20} color={theme.colors.primary} />
              <Text variant="subtitle" style={styles.statValue}>
                12
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Workouts
              </Text>
            </View>

            <View style={styles.statItem}>
              <Dumbbell size={20} color={theme.colors.secondary} />
              <Text variant="subtitle" style={styles.statValue}>
                28
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Exercises
              </Text>
            </View>

            <View style={styles.statItem}>
              <Heart size={20} color={theme.colors.status.error} />
              <Text variant="subtitle" style={styles.statValue}>
                8
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Favorites
              </Text>
            </View>
          </View>
        </GlassMorphicCard>

        {/* Navigation Items */}
        <View style={styles.navigationContainer}>
          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <Home
                  size={22}
                  color={
                    activeRouteName === "Home" ? theme.colors.primary : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Home" && { color: theme.colors.primary },
                  ]}
                >
                  Home
                </Text>
              </View>
            )}
            onPress={() => navigateTo("Home")}
            style={[
              styles.drawerItem,
              activeRouteName === "Home" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <Dumbbell
                  size={22}
                  color={
                    activeRouteName === "Exercises"
                      ? theme.colors.primary
                      : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Exercises" && { color: theme.colors.primary },
                  ]}
                >
                  Exercises
                </Text>
              </View>
            )}
            onPress={() => navigateTo("Exercises")}
            style={[
              styles.drawerItem,
              activeRouteName === "Exercises" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <Compass
                  size={22}
                  color={
                    activeRouteName === "Discover"
                      ? theme.colors.primary
                      : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Discover" && { color: theme.colors.primary },
                  ]}
                >
                  Discover
                </Text>
              </View>
            )}
            onPress={() => navigateTo("Discover")}
            style={[
              styles.drawerItem,
              activeRouteName === "Discover" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <User
                  size={22}
                  color={
                    activeRouteName === "Profile" ? theme.colors.primary : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Profile" && { color: theme.colors.primary },
                  ]}
                >
                  Profile
                </Text>
              </View>
            )}
            onPress={() => navigateTo("Profile")}
            style={[
              styles.drawerItem,
              activeRouteName === "Profile" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <Bell
                  size={22}
                  color={
                    activeRouteName === "Notifications"
                      ? theme.colors.primary
                      : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Notifications" && { color: theme.colors.primary },
                  ]}
                >
                  Notifications
                </Text>
                <View style={styles.badge}>
                  <Text variant="caption" style={styles.badgeText}>
                    3
                  </Text>
                </View>
              </View>
            )}
            onPress={() => navigateTo("Notifications")}
            style={[
              styles.drawerItem,
              activeRouteName === "Notifications" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />
        </View>

        <View style={styles.divider} />

        {/* Settings and Help */}
        <View style={styles.navigationContainer}>
          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <Settings
                  size={22}
                  color={
                    activeRouteName === "Settings"
                      ? theme.colors.primary
                      : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Settings" && { color: theme.colors.primary },
                  ]}
                >
                  Settings
                </Text>
              </View>
            )}
            onPress={() => navigateTo("Settings")}
            style={[
              styles.drawerItem,
              activeRouteName === "Settings" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <HelpCircle
                  size={22}
                  color={
                    activeRouteName === "Help" ? theme.colors.primary : theme.colors.text.primary
                  }
                />
                <Text
                  variant="subtitle"
                  style={[
                    styles.drawerItemLabel,
                    activeRouteName === "Help" && { color: theme.colors.primary },
                  ]}
                >
                  Help & Support
                </Text>
              </View>
            )}
            onPress={() => navigateTo("Help")}
            style={[
              styles.drawerItem,
              activeRouteName === "Help" && {
                backgroundColor: theme.dark
                  ? "rgba(10, 132, 255, 0.1)"
                  : "rgba(10, 132, 255, 0.05)",
              },
            ]}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <Share2 size={22} color={theme.colors.text.primary} />
                <Text variant="subtitle" style={styles.drawerItemLabel}>
                  Share App
                </Text>
              </View>
            )}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              // Share functionality
            }}
            style={styles.drawerItem}
          />

          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                {theme.dark ? (
                  <Sun size={22} color={theme.colors.text.primary} />
                ) : (
                  <Moon size={22} color={theme.colors.text.primary} />
                )}
                <Text variant="subtitle" style={styles.drawerItemLabel}>
                  {theme.dark ? "Light Mode" : "Dark Mode"}
                </Text>
              </View>
            )}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              // Toggle theme
            }}
            style={styles.drawerItem}
          />
        </View>

        <View style={styles.divider} />

        {/* Sign Out */}
        {user && (
          <DrawerItem
            label={() => (
              <View style={styles.drawerItemContent}>
                <LogOut size={22} color={theme.colors.status.error} />
                <Text
                  variant="subtitle"
                  style={[styles.drawerItemLabel, { color: theme.colors.status.error }]}
                >
                  Sign Out
                </Text>
              </View>
            )}
            onPress={handleSignOut}
            style={styles.drawerItem}
          />
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
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    marginLeft: "auto",
    minWidth: 20,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(28, 28, 30, 0.7)", // Semi-transparent dark background
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  },
  drawerItemContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  drawerItemLabel: {
    fontWeight: "500",
    marginLeft: 16,
  },
  email: {
    opacity: 0.7,
  },
  navigationContainer: {
    marginBottom: 16,
  },
  profileCard: {
    marginBottom: 24,
    padding: 16,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontWeight: "bold",
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
