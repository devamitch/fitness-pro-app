"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity, Modal, Platform } from "react-native"
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { Text } from "./Text"
import { GlassMorphicCard } from "./GlassMorphicCard"
import { updateChecker } from "../utils/updateChecker"
import { useTheme } from "../theme/theme"
import { Download, X } from "lucide-react-native"

interface UpdateNotificationProps {
  onDismiss?: () => void
  onUpdate?: () => void
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onDismiss, onUpdate }) => {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    const checkForUpdate = async () => {
      const isUpdateAvailable = await updateChecker.checkForUpdate()
      setUpdateAvailable(isUpdateAvailable)
      setVisible(isUpdateAvailable)
    }

    checkForUpdate()
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  const handleUpdate = async () => {
    setVisible(false)
    onUpdate?.()

    const downloaded = await updateChecker.downloadUpdate()
    if (downloaded) {
      await updateChecker.applyUpdate()
    }
  }

  if (!visible) return null

  // For iOS, use a modal with blur background
  if (Platform.OS === "ios") {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <BlurView intensity={30} tint={theme.dark ? "dark" : "light"} style={styles.modalContainer}>
          <Animated.View entering={SlideInUp} exiting={SlideOutDown} style={styles.modalContent}>
            <GlassMorphicCard style={styles.card}>
              <View style={styles.header}>
                <Text variant="subtitle">Update Available</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                  <X size={20} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <Text variant="body" style={[styles.message, { color: theme.colors.text.secondary }]}>
                A new version of the app is available. Update now to get the latest features and improvements.
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.dismissButton, { borderColor: theme.colors.card.border }]}
                  onPress={handleDismiss}
                >
                  <Text variant="button" style={{ color: theme.colors.text.primary }}>
                    Later
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleUpdate}
                >
                  <Download size={16} color={theme.colors.text.inverse} />
                  <Text variant="button" style={[styles.updateButtonText, { color: theme.colors.text.inverse }]}>
                    Update
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassMorphicCard>
          </Animated.View>
        </BlurView>
      </Modal>
    )
  }

  // For Android, use a bottom sheet
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Download size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="subtitle">Update Available</Text>
          <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
            Update now for the latest features
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDismiss}>
            <Text variant="button" style={{ color: theme.colors.text.tertiary }}>
              Later
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.updateActionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleUpdate}
          >
            <Text variant="button" style={{ color: theme.colors.text.inverse }}>
              Update
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10, 132, 255, 0.1)",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  updateActionButton: {
    paddingHorizontal: 16,
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
  },
  card: {
    padding: 20,
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
  message: {
    marginBottom: 24,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  dismissButton: {
    borderWidth: 1,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateButtonText: {
    marginLeft: 8,
  },
})
