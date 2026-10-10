"use client"

import { type ReactNode, useEffect } from "react"
import { StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")
const DRAWER_WIDTH = width * 0.8

export interface DrawerItem {
  key: string
  label: string
  icon?: ReactNode
  onPress: () => void
}

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  items: DrawerItem[]
  activeKey?: string
  header?: ReactNode
  footer?: ReactNode
}

export const Drawer = ({ isOpen, onClose, items, activeKey, header, footer }: DrawerProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // Animation values
  const translateX = useSharedValue(-DRAWER_WIDTH)
  const opacity = useSharedValue(0)

  // Update animation when isOpen changes
  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    }
  }, [isOpen])

  // Animated style for the drawer
  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  // Animated style for the overlay
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      display: opacity.value === 0 ? "none" : "flex",
    }
  })

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <Animated.View
        style={[
          styles.drawer,
          drawerStyle,
          {
            backgroundColor: theme.colors.cardBackground,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            width: DRAWER_WIDTH,
          },
        ]}
      >
        {header && (
          <Box padding="md" borderBottomWidth={1} borderBottomColor="border">
            {header}
          </Box>
        )}

        <Box flex={1}>
          {items.map((item) => {
            const isActive = activeKey === item.key

            return (
              <TouchableOpacity key={item.key} onPress={item.onPress} style={styles.item}>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  padding="md"
                  backgroundColor={isActive ? "primary20" : "transparent"}
                  borderLeftWidth={isActive ? 4 : 0}
                  borderLeftColor="primary"
                >
                  {item.icon && <Box marginRight="md">{item.icon}</Box>}
                  <Text color={isActive ? "primary" : "text"} variant={isActive ? "bodyBold" : "body"}>
                    {item.label}
                  </Text>
                </Box>
              </TouchableOpacity>
            )
          })}
        </Box>

        {footer && (
          <Box padding="md" borderTopWidth={1} borderTopColor="border">
            {footer}
          </Box>
        )}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  item: {
    overflow: "hidden",
  },
})
