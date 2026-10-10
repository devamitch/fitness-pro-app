"use client"

import React from "react"
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

const { width } = Dimensions.get("window")

export interface TabItem {
  key: string
  label: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

interface GlassTabBarProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}

export const GlassTabBar = ({ items, activeKey, onChange }: GlassTabBarProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const itemWidth = width / items.length

  // Animation values
  const indicatorPosition = useSharedValue(items.findIndex((item) => item.key === activeKey) * itemWidth)
  const indicatorScale = useSharedValue(1)
  const indicatorOpacity = useSharedValue(1)

  // Update indicator position when active key changes
  React.useEffect(() => {
    const index = items.findIndex((item) => item.key === activeKey)
    indicatorPosition.value = withSpring(index * itemWidth, {
      damping: 15,
      stiffness: 150,
    })

    // Animate scale and opacity for a nice effect
    indicatorScale.value = withTiming(0.9, { duration: 100 }, () => {
      indicatorScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    })
    indicatorOpacity.value = withTiming(0.8, { duration: 100 }, () => {
      indicatorOpacity.value = withSpring(1, { damping: 15, stiffness: 150 })
    })
  }, [activeKey, items, itemWidth])

  // Animated styles for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }, { scale: indicatorScale.value }],
      opacity: indicatorOpacity.value,
    }
  })

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      <BlurView intensity={80} tint={theme.isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: itemWidth - 20,
            backgroundColor: theme.isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.7)",
            borderColor: theme.isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.8)",
          },
          indicatorStyle,
        ]}
      />

      {/* Tab items */}
      {items.map((item) => {
        const isActive = item.key === activeKey

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tabButton}
            onPress={() => onChange(item.key)}
            activeOpacity={0.7}
          >
            {isActive ? item.activeIcon : item.icon}
            <Text
              variant="caption"
              style={[
                styles.label,
                {
                  color: isActive ? theme.colors.primary : theme.colors.textMuted,
                  opacity: isActive ? 1 : 0.7,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 70,
    position: "relative",
    borderTopWidth: 0,
  },
  border: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  indicator: {
    position: "absolute",
    height: 40,
    top: 10,
    left: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
  },
})
