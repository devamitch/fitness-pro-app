"use client"

import type React from "react"
import { View, StyleSheet, TouchableOpacity, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "@/hooks/useTheme"
import { Text } from "@/components/ui/Text"
import { ArrowLeft, Menu, Bell } from "lucide-react-native"

export interface HeaderProps {
  title?: string
  showBack?: boolean
  showMenu?: boolean
  showNotification?: boolean
  onBackPress?: () => void
  onMenuPress?: () => void
  onNotificationPress?: () => void
  rightComponent?: React.ReactNode
  style?: ViewStyle
  transparent?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showMenu = false,
  showNotification = false,
  onBackPress,
  onMenuPress,
  onNotificationPress,
  rightComponent,
  style,
  transparent = false,
}) => {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: transparent ? "transparent" : colors.background,
          borderBottomColor: transparent ? "transparent" : colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
        style,
      ]}
    >
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        {showMenu && (
          <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
            <Menu size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {title && (
        <Text variant="subtitle" style={styles.title}>
          {title}
        </Text>
      )}

      <View style={styles.rightContainer}>
        {rightComponent}

        {showNotification && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <Bell size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
})
