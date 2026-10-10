"use client"

import { storage } from "@/utils/storage"
import * as Notifications from "expo-notifications"
import { useCallback } from "react"
import { Platform } from "react-native"

export const useNotifications = () => {
  const registerForPushNotifications = useCallback(async () => {
    try {
      // Check if we already have a token
      const existingToken = storage.getString("push-token")
      if (existingToken) return existingToken

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!")
        return null
      }

      // Get the token
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        })
      ).data

      // Save the token
      storage.set("push-token", token)

      // Configure notifications for Android
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        })
      }

      return token
    } catch (error) {
      console.log("Error getting push token", error)
      return null
    }
  }, [])

  const scheduleLocalNotification = useCallback(
    async (title: string, body: string, trigger: Notifications.NotificationTriggerInput = null) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger,
      })
    },
    [],
  )

  return {
    registerForPushNotifications,
    scheduleLocalNotification,
  }
}
