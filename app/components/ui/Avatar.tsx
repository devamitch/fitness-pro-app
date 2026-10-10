"use client"

import type React from "react"
import { View, Image, StyleSheet, type ViewStyle, type ImageSourcePropType, TouchableOpacity } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { Text } from "./Text"

export interface AvatarProps {
  source?: ImageSourcePropType
  size?: number
  name?: string
  style?: ViewStyle
  onPress?: () => void
  showBadge?: boolean
  badgeColor?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 48,
  name,
  style,
  onPress,
  showBadge = false,
  badgeColor,
}) => {
  const { colors } = useTheme()

  // Generate initials from name
  const getInitials = () => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const avatarContent = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: source ? "transparent" : colors.primary,
        },
        style,
      ]}
    >
      {source ? (
        <Image source={source} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text variant="subtitle" style={{ color: "#fff", fontSize: size / 3 }}>
          {getInitials()}
        </Text>
      )}
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: size / 4,
              height: size / 4,
              borderRadius: size / 8,
              backgroundColor: badgeColor || colors.success,
              borderColor: colors.background,
              borderWidth: size / 24,
            },
          ]}
        />
      )}
    </View>
  )

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{avatarContent}</TouchableOpacity>
  }

  return avatarContent
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
})
