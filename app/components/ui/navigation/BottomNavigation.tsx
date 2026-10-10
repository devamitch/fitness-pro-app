"use client"

import type { ReactNode } from "react"
import { TouchableOpacity, StyleSheet } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export interface BottomNavigationItem {
  key: string
  label: string
  icon: ReactNode
  activeIcon?: ReactNode
  badge?: number | boolean
}

export interface BottomNavigationProps {
  items: BottomNavigationItem[]
  activeKey: string
  onChange: (key: string) => void
  showLabels?: boolean
  variant?: "default" | "floating"
}

export const BottomNavigation = ({
  items,
  activeKey,
  onChange,
  showLabels = true,
  variant = "default",
}: BottomNavigationProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const itemWidth = 100 / items.length

  // Animation values
  const indicatorPosition = useSharedValue(items.findIndex((item) => item.key === activeKey) * itemWidth)

  // Handle item press
  const handlePress = (key: string) => {
    const index = items.findIndex((item) => item.key === key)
    indicatorPosition.value = withSpring(index * itemWidth, {
      damping: 15,
      stiffness: 150,
    })
    onChange(key)
  }

  // Animated style for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: (indicatorPosition.value * items.length) / 100,
        },
      ],
    }
  })

  return (
    <Box
      backgroundColor="cardBackground"
      borderTopWidth={variant === "default" ? 1 : 0}
      borderTopColor="border"
      paddingBottom={insets.bottom ? insets.bottom : "md"}
      style={[
        variant === "floating" && {
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          borderRadius: theme.borderRadii.lg,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <Box flexDirection="row" position="relative" paddingTop="sm">
        {items.map((item) => {
          const isActive = activeKey === item.key

          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => handlePress(item.key)}
              style={[
                styles.item,
                {
                  width: `${itemWidth}%`,
                },
              ]}
            >
              <Box alignItems="center">
                <Box position="relative">
                  {isActive ? item.activeIcon || item.icon : item.icon}

                  {item.badge && (
                    <Box
                      position="absolute"
                      top={-4}
                      right={-4}
                      backgroundColor="error"
                      borderRadius="rounded"
                      minWidth={16}
                      height={16}
                      alignItems="center"
                      justifyContent="center"
                      paddingHorizontal="xxs"
                    >
                      {typeof item.badge === "number" && (
                        <Text color="white" style={{ fontSize: 10, fontWeight: "bold" }}>
                          {item.badge > 99 ? "99+" : item.badge}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>

                {showLabels && (
                  <Text variant="caption" color={isActive ? "primary" : "textSecondary"} marginTop="xs">
                    {item.label}
                  </Text>
                )}
              </Box>
            </TouchableOpacity>
          )
        })}

        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            {
              backgroundColor: theme.colors.primary,
              width: `${itemWidth}%`,
            },
          ]}
        />
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: 2,
  },
})
