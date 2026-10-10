"use client"
import { useNavigation } from "@react-navigation/native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Bell, CheckCircle } from "lucide-react-native"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { notificationApi } from "../services/api"
import { useAuthStore } from "../stores/authStore"

export const NotificationsScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => (user ? notificationApi.getNotifications(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] })
    },
  })

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Render notification item
  const renderNotificationItem = ({ item, index }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <TouchableOpacity
          style={[styles.notificationItem, !item.read && styles.unreadNotification]}
          onPress={() => {
            if (!item.read) {
              markAsReadMutation.mutate(item.id)
            }

            // Handle notification action based on data
            if (item.data && item.data.type === "workout") {
              navigation.navigate("WorkoutDetail", { workoutId: item.data.id })
            } else if (item.data && item.data.type === "exercise") {
              navigation.navigate("Exercise", { exerciseId: item.data.id })
            }
          }}
        >
          <View style={styles.notificationIcon}>
            <Bell size={24} color="#0A84FF" />
          </View>
          <View style={styles.notificationContent}>
            <Text variant="subtitle" numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="body" numberOfLines={2} style={styles.notificationBody}>
              {item.body}
            </Text>
            <Text variant="caption" style={styles.notificationTime}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!notifications || notifications.length === 0) return

    const unreadNotifications = notifications.filter((notification) => !notification.read)
    if (unreadNotifications.length === 0) return

    // Mark each unread notification as read
    for (const notification of unreadNotifications) {
      await markAsReadMutation.mutateAsync(notification.id)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text variant="header">Notifications</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <CheckCircle size={24} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      {/* Notifications list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text variant="body">Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#8E8E93" />
              <Text variant="subtitle" style={styles.emptyText}>
                No notifications yet
              </Text>
              <Text variant="body" style={styles.emptySubtext}>
                We'll notify you when there's something new
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  container: {
    backgroundColor: "#F2F2F7",
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingTop: 80,
  },
  emptySubtext: {
    color: "#8E8E93",
    textAlign: "center",
  },
  emptyText: {
    marginBottom: 8,
    marginTop: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  markAllButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  notificationBody: {
    marginBottom: 8,
    marginTop: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "#E9F7FF",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginRight: 16,
    width: 48,
  },
  notificationItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    flexDirection: "row",
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationTime: {
    color: "#8E8E93",
  },
  notificationsList: {
    padding: 20,
  },
  unreadDot: {
    alignSelf: "flex-start",
    backgroundColor: "#0A84FF",
    borderRadius: 5,
    height: 10,
    marginTop: 8,
    width: 10,
  },
  unreadNotification: {
    backgroundColor: "#F0F8FF",
  },
})
