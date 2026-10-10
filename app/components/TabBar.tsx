"use client"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"
import { useTheme } from "@shopify/restyle"
import type { Theme } from "../theme"
import { Text } from "./Text"
import { Home, Dumbbell, Compass, User } from "lucide-react-native"

export const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets()
  const theme = useTheme<Theme>()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          paddingBottom: insets.bottom || 16,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        let icon
        let label

        switch (route.name) {
          case "HomeTab":
            icon = <Home size={24} color={isFocused ? theme.colors.primary : theme.colors.textMuted} />
            label = "Home"
            break
          case "ExercisesTab":
            icon = <Dumbbell size={24} color={isFocused ? theme.colors.primary : theme.colors.textMuted} />
            label = "Exercises"
            break
          case "DiscoverTab":
            icon = <Compass size={24} color={isFocused ? theme.colors.primary : theme.colors.textMuted} />
            label = "Discover"
            break
          case "ProfileTab":
            icon = <User size={24} color={isFocused ? theme.colors.primary : theme.colors.textMuted} />
            label = "Profile"
            break
        }

        const animatedStyle = useAnimatedStyle(() => {
          return {
            transform: [
              {
                scale: withSpring(isFocused ? 1.1 : 1, {
                  damping: 15,
                  stiffness: 150,
                }),
              },
            ],
          }
        }, [isFocused])

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Animated.View style={[styles.iconContainer, animatedStyle]}>{icon}</Animated.View>
            <Text
              variant="caption"
              style={{
                color: isFocused ? theme.colors.primary : theme.colors.textMuted,
                marginTop: 4,
              }}
            >
              {label}
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
    borderTopWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Semi-transparent white
    borderTopColor: "rgba(255, 255, 255, 0.3)", // Subtle border
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
})
