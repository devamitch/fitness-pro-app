"use client"

import { IMAGES } from "@/assets/images"
import { useNavigation } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import {
  Award,
  Bell,
  Calendar,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  TrendingUp,
  User,
} from "lucide-react-native"
import { useState } from "react"
import { Alert, Image, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { progressApi, supabase } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import { useThemeStore } from "../stores/themeStore"

export const ProfileScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const [isDarkMode, setIsDarkMode] = useState(mode === "dark")

  // Fetch user progress
  const { data: progress } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => (user ? progressApi.getUserProgress(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  // Calculate stats
  const totalWorkouts = progress ? progress.length : 0
  const totalMinutes = progress ? progress.reduce((acc, curr) => acc + curr.duration / 60, 0) : 0
  const totalCalories = progress ? progress.reduce((acc, curr) => acc + curr.calories_burned, 0) : 0

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    setMode(newMode)
  }

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        onPress: async () => {
          await supabase.auth.signOut()
          signOut()
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="header">Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Image
            source={user?.avatarUrl ? { uri: user.avatarUrl } : IMAGES.logo}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text variant="title">{user?.username || "Fitness Enthusiast"}</Text>
            <Text variant="caption">{user?.email || "user@example.com"}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text variant="button">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statCard}>
            <Calendar size={20} color="#0A84FF" />
            <Text variant="title" style={styles.statValue}>
              {totalWorkouts}
            </Text>
            <Text variant="caption">Workouts</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statCard}>
            <TrendingUp size={20} color="#32D74B" />
            <Text variant="title" style={styles.statValue}>
              {Math.round(totalMinutes)}
            </Text>
            <Text variant="caption">Minutes</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.statCard}>
            <Award size={20} color="#FF9500" />
            <Text variant="title" style={styles.statValue}>
              {totalCalories}
            </Text>
            <Text variant="caption">Calories</Text>
          </Animated.View>
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text variant="subtitle" style={styles.settingsTitle}>
            Settings
          </Text>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate("AccountSettings")}
              >
                <View style={styles.settingsItemLeft}>
                  <User size={20} color="#0A84FF" />
                  <Text variant="body" style={styles.settingsItemText}>
                    Account
                  </Text>
                </View>
                <ChevronRight size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate("NotificationSettings")}
              >
                <View style={styles.settingsItemLeft}>
                  <Bell size={20} color="#FF9500" />
                  <Text variant="body" style={styles.settingsItemText}>
                    Notifications
                  </Text>
                </View>
                <ChevronRight size={20} color="#8E8E93" />
              </TouchableOpacity>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Moon size={20} color="#5856D6" />
                  <Text variant="body" style={styles.settingsItemText}>
                    Dark Mode
                  </Text>
                </View>
                <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
              </View>

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate("AppSettings")}
              >
                <View style={styles.settingsItemLeft}>
                  <Settings size={20} color="#32D74B" />
                  <Text variant="body" style={styles.settingsItemText}>
                    App Settings
                  </Text>
                </View>
                <ChevronRight size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate("Help")}
              >
                <View style={styles.settingsItemLeft}>
                  <HelpCircle size={20} color="#FF3B30" />
                  <Text variant="body" style={styles.settingsItemText}>
                    Help & Support
                  </Text>
                </View>
                <ChevronRight size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem} onPress={handleSignOut}>
                <View style={styles.settingsItemLeft}>
                  <LogOut size={20} color="#FF3B30" />
                  <Text variant="body" style={styles.settingsItemText}>
                    Sign Out
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text variant="caption" style={styles.versionText}>
            Version 1.0.0
          </Text>
        </View>

        {/* Spacer for bottom tabs */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 30,
    height: 60,
    marginRight: 16,
    width: 60,
  },
  container: {
    backgroundColor: "#F2F2F7",
    flex: 1,
  },
  editButton: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingsItem: {
    alignItems: "center",
    borderBottomColor: "#F2F2F7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingsItemLeft: {
    alignItems: "center",
    flexDirection: "row",
  },
  settingsItemText: {
    marginLeft: 16,
  },
  settingsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingsTitle: {
    marginBottom: 16,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "30%",
  },
  statValue: {
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  userInfo: {
    flex: 1,
  },
  userInfoContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    flexDirection: "row",
    marginBottom: 24,
    marginHorizontal: 20,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  versionText: {
    color: "#8E8E93",
  },
})
