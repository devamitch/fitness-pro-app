"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, TouchableOpacity, FlatList, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Text } from "../components/Text"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { useTheme } from "../theme/theme"
import { useAuthStore } from "../stores/authStore"
import { notificationsApi } from "../services/api"
import { cacheManager } from "../utils/cacheManager"
import { ArrowLeft, BellOff, Trash2, Check, X } from "lucide-react-native"

const { width } = Dimensions.get("window")
const isTablet = width >= 768

// Notification types
type NotificationType = "workout" | "achievement" | "friend" | "system" | "challenge"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

export const PremiumNotificationsScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all")

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      try {
        // Try to get from cache first
        const cached = await cacheManager.get(`notifications-${user?.id}`)
        if (cached) return cached

        const data = await notificationsApi.getNotifications(user?.id || "")

        // Cache the result
        await cacheManager.set(`notifications-${user?.id}`, data)

        return data
      } catch (error) {
        console.error("Error fetching notifications:", error)
        return []
      }
    },
    enabled: !!user,
  })

  // Filter notifications based on selected tab
  const filteredNotifications = notifications
    ? selectedTab === "all"
      ? notifications
      : notifications.filter((notification) => !notification.read)
    : []

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)

      // Update cache
      queryClient.setQueryData(["notifications", user?.id], (oldData: Notification[] | undefined) => {
        if (!oldData) return []
        return oldData.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id)

      // Update cache
      queryClient.setQueryData(["notifications", user?.id], (oldData: Notification[] | undefined) => {
        if (!oldData) return []
        return oldData.filter((notification) => notification.id !== id)
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead(user?.id || "")

      // Update cache
      queryClient.setQueryData(["notifications", user?.id], (oldData: Notification[] | undefined) => {
        if (!oldData) return []
        return oldData.map((notification) => ({ ...notification, read: true }))
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      await notificationsApi.clearAllNotifications(user?.id || "")

      // Update cache
      queryClient.setQueryData(["notifications", user?.id], [])
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "workout":
        return "🏋️‍♂️"
      case "achievement":
        return "🏆"
      case "friend":
        return "👋"
      case "challenge":
        return "🔥"
      case "system":
        return "⚙️"
      default:
        return "📱"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) {
      return "just now"
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <Animated.View
        entering={SlideInRight.springify()}
        exiting={SlideOutLeft.springify()}
        style={styles.notificationItemContainer}
      >
        <GlassMorphicCard
          style={[
            styles.notificationItem,
            item.read ? { opacity: 0.8 } : { borderLeftColor: theme.colors.primary, borderLeftWidth: 3 },
          ]}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationIconContainer}>
              <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
            </View>
            <View style={styles.notificationTextContainer}>
              <Text variant="subtitle" numberOfLines={1}>
                {item.title}
              </Text>
              <Text variant="body" style={{ color: theme.colors.text.secondary }} numberOfLines={2}>
                {item.message}
              </Text>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginTop: 4 }}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
          <View style={styles.notificationActions}>
            {!item.read && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleMarkAsRead(item.id)}
              >
                <Check size={16} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.error }]}
              onPress={() => handleDeleteNotification(item.id)}
            >
              <Trash2 size={16} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </GlassMorphicCard>
      </Animated.View>
    )
  }

  // Render empty state
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyStateContainer}>
        <BellOff size={64} color={theme.colors.text.tertiary} />
        <Text variant="subtitle" style={{ marginTop: 16, textAlign: "center" }}>
          No notifications
        </Text>
        <Text variant="body" style={{ color: theme.colors.text.tertiary, textAlign: "center", marginTop: 8 }}>
          {selectedTab === "all" ? "You don't have any notifications yet." : "You don't have any unread notifications."}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title">Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "all" && { backgroundColor: theme.colors.primary }]}
          onPress={() => setSelectedTab("all")}
        >
          <Text
            variant="button"
            style={{ color: selectedTab === "all" ? theme.colors.text.inverse : theme.colors.text.primary }}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "unread" && { backgroundColor: theme.colors.primary }]}
          onPress={() => setSelectedTab("unread")}
        >
          <Text
            variant="button"
            style={{ color: selectedTab === "unread" ? theme.colors.text.inverse : theme.colors.text.primary }}
          >
            Unread
          </Text>
          {notifications && notifications.some((notification) => !notification.read) && (
            <View style={[styles.badge, { backgroundColor: theme.colors.status.error }]}>
              <Text variant="caption" style={{ color: theme.colors.text.inverse }}>
                {notifications.filter((notification) => !notification.read).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonLarge, { backgroundColor: theme.colors.primary }]}
          onPress={handleMarkAllAsRead}
          disabled={!notifications || notifications.every((notification) => notification.read)}
        >
          <Check size={16} color={theme.colors.text.inverse} />
          <Text variant="button" style={{ color: theme.colors.text.inverse, marginLeft: 8 }}>
            Mark All as Read
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonLarge, { backgroundColor: theme.colors.status.error }]}
          onPress={handleClearAll}
          disabled={!notifications || notifications.length === 0}
        >
          <X size={16} color={theme.colors.text.inverse} />
          <Text variant="button" style={{ color: theme.colors.text.inverse, marginLeft: 8 }}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
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
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButtonLarge: {
    width: "auto",
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    marginRight: 12,
    marginLeft: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationItemContainer: {
    marginBottom: 16,
  },
  notificationItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(150, 150, 150, 0.1)",
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  notificationActions: {
    flexDirection: "row",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
})
