"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Alert } from "react-native"
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { useTheme } from "../theme/theme"
import { Download, X } from "lucide-react-native"
import { updateChecker } from "../utils/updateChecker"

export const AppUpdateNotification: React.FC = () => {
  const theme = useTheme()
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    // Check for updates when component mounts
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    try {
      const updateAvailable = await updateChecker.checkForUpdate()
      setIsUpdateAvailable(updateAvailable)

      if (updateAvailable) {
        // Show notification after a short delay
        setTimeout(() => {
          setIsVisible(true)
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to check for updates:", error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleUpdate = async () => {
    try {
      setIsDownloading(true)
      const downloaded = await updateChecker.downloadUpdate()

      if (downloaded) {
        setIsVisible(false)
        setIsDownloading(false)

        // Show confirmation dialog
        setTimeout(() => {
          Alert.alert(
            "Update Ready",
            "The update has been downloaded. Would you like to restart now to apply the update?",
            [
              {
                text: "Later",
                style: "cancel",
              },
              {
                text: "Restart Now",
                onPress: async () => {
                  await updateChecker.applyUpdate()
                },
              },
            ],
          )
        }, 500)
      } else {
        setIsDownloading(false)
        Alert.alert("Update Failed", "Failed to download the update. Please try again later.")
      }
    } catch (error) {
      console.error("Failed to download update:", error)
      setIsDownloading(false)
      Alert.alert("Update Failed", "An error occurred while downloading the update.")
    }
  }

  if (!isVisible || !isUpdateAvailable) {
    return null
  }

  // iOS style modal
  if (Platform.OS === "ios") {
    return (
      <Modal transparent animationType="fade" visible={isVisible}>
        <BlurView intensity={30} tint={theme.dark ? "dark" : "light"} style={styles.modalContainer}>
          <Animated.View
            entering={SlideInUp.springify()}
            exiting={SlideOutDown.springify()}
            style={[styles.modalContent, { backgroundColor: theme.colors.card.background }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Update Available</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                <X size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
              A new version of the app is available with new features and improvements.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.laterButton, { borderColor: theme.colors.card.border }]}
                onPress={handleDismiss}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.updateButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdate}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>Downloading...</Text>
                ) : (
                  <>
                    <Download size={16} color={theme.colors.text.inverse} />
                    <Text style={[styles.buttonText, { color: theme.colors.text.inverse, marginLeft: 8 }]}>Update</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    )
  }

  // Android style bottom sheet
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: "rgba(0,0,0,0.5)" }]}
    >
      <Animated.View
        entering={SlideInUp.springify()}
        exiting={SlideOutDown.springify()}
        style={[styles.bottomSheet, { backgroundColor: theme.colors.background.secondary }]}
      >
        <View style={styles.handle} />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Download size={24} color={theme.colors.primary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Update Available</Text>
            <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
              A new version of the app is available with new features and improvements.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.card.border }]}
            onPress={handleDismiss}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text.primary }]}>Later</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.updateActionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleUpdate}
            disabled={isDownloading}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
              {isDownloading ? "Downloading..." : "Update Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCCCCC",
    alignSelf: "center",
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,122,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  updateActionButton: {
    borderWidth: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  laterButton: {
    borderWidth: 1,
  },
  updateButton: {
    minWidth: 100,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
