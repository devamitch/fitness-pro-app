"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Platform, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Animated, { FadeInDown } from "react-native-reanimated"
import * as Notifications from "expo-notifications"
import * as Application from "expo-application"
import { BlurView } from "expo-blur"
import { Text } from "../components/Text"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { useTheme, useThemeStore } from "../theme/theme"
import { useAuthStore } from "../stores/authStore"
import { useTTSStore } from "../stores/ttsStore"
import { cacheManager } from "../utils/cacheManager"
import { offlineManager } from "../utils/offlineManager"
import { supabaseSync } from "../services/supabaseSync"
import { updateChecker } from "../utils/updateChecker"
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Bell,
  Volume2,
  Trash2,
  LogOut,
  RefreshCw,
  Download,
  Smartphone,
  HelpCircle,
  Shield,
  User,
} from "lucide-react-native"

const { width } = Dimensions.get("window")
const isTablet = width >= 768

export const PremiumSettingsScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { user, signOut } = useAuthStore()
  const { theme: themeMode, setTheme } = useThemeStore()
  const { enabled: ttsEnabled, setEnabled: setTTSEnabled } = useTTSStore()

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = useState(false)
  const [waterRemindersEnabled, setWaterRemindersEnabled] = useState(false)
  const [appVersion, setAppVersion] = useState("")
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)

  // Get app version
  useEffect(() => {
    const getAppVersion = async () => {
      const version = await Application.nativeApplicationVersion
      const buildVersion = await Application.nativeBuildVersion
      setAppVersion(`${version} (${buildVersion})`)
    }

    getAppVersion()

    // Check notification permissions
    checkNotificationPermissions()

    // Get pending sync count
    setPendingSyncCount(supabaseSync.getPendingCount())
  }, [])

  // Check notification permissions
  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync()
    setNotificationsEnabled(status === "granted")
  }

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
  }

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      // Disable notifications
      setNotificationsEnabled(false)
      setWorkoutRemindersEnabled(false)
      setWaterRemindersEnabled(false)
    } else {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync()
      setNotificationsEnabled(status === "granted")
    }
  }

  // Handle workout reminders toggle
  const handleWorkoutRemindersToggle = async () => {
    if (!notificationsEnabled) return

    if (workoutRemindersEnabled) {
      // Cancel workout reminders
      await Notifications.cancelScheduledNotificationAsync("workout-reminder")
      setWorkoutRemindersEnabled(false)
    } else {
      // Schedule workout reminders
      await Notifications.scheduleNotificationAsync({
        identifier: "workout-reminder",
        content: {
          title: "Time to workout!",
          body: "Don't forget your daily exercise routine.",
          sound: true,
        },
        trigger: {
          hour: 18, // 6 PM
          minute: 0,
          repeats: true,
        },
      })
      setWorkoutRemindersEnabled(true)
    }
  }

  // Handle water reminders toggle
  const handleWaterRemindersToggle = async () => {
    if (!notificationsEnabled) return

    if (waterRemindersEnabled) {
      // Cancel water reminders
      await Notifications.cancelScheduledNotificationAsync("water-reminder")
      setWaterRemindersEnabled(false)
    } else {
      // Schedule water reminders
      await Notifications.scheduleNotificationAsync({
        identifier: "water-reminder",
        content: {
          title: "Stay hydrated!",
          body: "Remember to drink water throughout your workout.",
          sound: true,
        },
        trigger: {
          hour: 10,
          minute: 0,
          repeats: true,
        },
      })
      setWaterRemindersEnabled(true)
    }
  }

  // Handle TTS toggle
  const handleTTSToggle = () => {
    setTTSEnabled(!ttsEnabled)
  }

  // Handle clear cache
  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await cacheManager.clear()
            Alert.alert("Cache Cleared", "All cached data has been cleared.")
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Handle sync data
  const handleSyncData = async () => {
    if (!(await offlineManager.isOnline())) {
      Alert.alert("Offline", "You are currently offline. Please connect to the internet and try again.")
      return
    }

    await supabaseSync.syncAll()
    setPendingSyncCount(supabaseSync.getPendingCount())
    Alert.alert("Sync Complete", "All data has been synchronized.")
  }

  // Handle check for updates
  const handleCheckForUpdates = async () => {
    setIsCheckingForUpdates(true)
    const isUpdateAvailable = await updateChecker.checkForUpdate()
    setIsCheckingForUpdates(false)

    if (isUpdateAvailable) {
      Alert.alert("Update Available", "A new version of the app is available. Would you like to update now?", [
        {
          text: "Later",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: async () => {
            const downloaded = await updateChecker.downloadUpdate()
            if (downloaded) {
              Alert.alert(
                "Update Ready",
                "The update has been downloaded. The app will now restart to apply the update.",
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      await updateChecker.applyUpdate()
                    },
                  },
                ],
              )
            }
          },
        },
      ])
    } else {
      Alert.alert("No Updates", "You are using the latest version of the app.")
    }
  }

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            signOut()
          },
        },
      ],
      { cancelable: true },
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title">Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassMorphicCard style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text variant="header" style={{ color: theme.colors.text.inverse }}>
                  {user?.username?.charAt(0) || "U"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text variant="subtitle">{user?.username || "User"}</Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {user?.email || ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editProfileButton, { backgroundColor: theme.colors.background.tertiary }]}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text variant="button" style={{ color: theme.colors.primary }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </GlassMorphicCard>
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Appearance
          </Text>
          <GlassMorphicCard style={styles.card}>
            <Text variant="body" style={styles.cardTitle}>
              Theme
            </Text>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === "light" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleThemeChange("light")}
              >
                <Sun size={24} color={themeMode === "light" ? theme.colors.text.inverse : theme.colors.text.primary} />
                <Text
                  variant="caption"
                  style={{
                    color: themeMode === "light" ? theme.colors.text.inverse : theme.colors.text.primary,
                    marginTop: 4,
                  }}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === "dark" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleThemeChange("dark")}
              >
                <Moon size={24} color={themeMode === "dark" ? theme.colors.text.inverse : theme.colors.text.primary} />
                <Text
                  variant="caption"
                  style={{
                    color: themeMode === "dark" ? theme.colors.text.inverse : theme.colors.text.primary,
                    marginTop: 4,
                  }}
                >
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === "system" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleThemeChange("system")}
              >
                <Monitor
                  size={24}
                  color={themeMode === "system" ? theme.colors.text.inverse : theme.colors.text.primary}
                />
                <Text
                  variant="caption"
                  style={{
                    color: themeMode === "system" ? theme.colors.text.inverse : theme.colors.text.primary,
                    marginTop: 4,
                  }}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </GlassMorphicCard>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Notifications
          </Text>
          <GlassMorphicCard style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#FFFFFF"}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="body" style={[styles.settingText, { marginLeft: 28 }]}>
                  Workout Reminders
                </Text>
              </View>
              <Switch
                value={workoutRemindersEnabled}
                onValueChange={handleWorkoutRemindersToggle}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#FFFFFF"}
                disabled={!notificationsEnabled}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="body" style={[styles.settingText, { marginLeft: 28 }]}>
                  Water Reminders
                </Text>
              </View>
              <Switch
                value={waterRemindersEnabled}
                onValueChange={handleWaterRemindersToggle}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#FFFFFF"}
                disabled={!notificationsEnabled}
              />
            </View>
          </GlassMorphicCard>
        </Animated.View>

        {/* Audio */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Audio
          </Text>
          <GlassMorphicCard style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Volume2 size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Voice Feedback
                </Text>
              </View>
              <Switch
                value={ttsEnabled}
                onValueChange={handleTTSToggle}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#FFFFFF"}
              />
            </View>
          </GlassMorphicCard>
        </Animated.View>

        {/* Data & Storage */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Data & Storage
          </Text>
          <GlassMorphicCard style={styles.card}>
            <TouchableOpacity style={styles.settingButton} onPress={handleClearCache}>
              <View style={styles.settingInfo}>
                <Trash2 size={20} color={theme.colors.status.error} />
                <Text variant="body" style={[styles.settingText, { color: theme.colors.status.error }]}>
                  Clear Cache
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={handleSyncData}>
              <View style={styles.settingInfo}>
                <RefreshCw size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Sync Data
                </Text>
              </View>
              {pendingSyncCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="caption" style={{ color: theme.colors.text.inverse }}>
                    {pendingSyncCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </GlassMorphicCard>
        </Animated.View>

        {/* App */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            App
          </Text>
          <GlassMorphicCard style={styles.card}>
            <TouchableOpacity style={styles.settingButton} onPress={handleCheckForUpdates}>
              <View style={styles.settingInfo}>
                <Download size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Check for Updates
                </Text>
              </View>
              {isCheckingForUpdates && (
                <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={styles.loadingBadge}>
                  <Text variant="caption" style={{ color: theme.colors.text.primary }}>
                    Checking...
                  </Text>
                </BlurView>
              )}
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate("About")}>
              <View style={styles.settingInfo}>
                <Smartphone size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  About
                </Text>
              </View>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                Version {appVersion}
              </Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate("Help")}>
              <View style={styles.settingInfo}>
                <HelpCircle size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Help & Support
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate("Privacy")}>
              <View style={styles.settingInfo}>
                <Shield size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Privacy Policy
                </Text>
              </View>
            </TouchableOpacity>
          </GlassMorphicCard>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Account
          </Text>
          <GlassMorphicCard style={styles.card}>
            <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate("AccountSettings")}>
              <View style={styles.settingInfo}>
                <User size={20} color={theme.colors.text.primary} />
                <Text variant="body" style={styles.settingText}>
                  Account Settings
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={handleSignOut}>
              <View style={styles.settingInfo}>
                <LogOut size={20} color={theme.colors.status.error} />
                <Text variant="body" style={[styles.settingText, { color: theme.colors.status.error }]}>
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </GlassMorphicCard>
        </Animated.View>

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: "600",
  },
  themeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeOption: {
    width: (width - 80) / 3,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    marginLeft: 12,
  },
  settingButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  loadingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  profileCard: {
    padding: 16,
    marginTop: 8,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
  },
  editProfileButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
})
