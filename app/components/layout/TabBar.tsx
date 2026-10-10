"use client"

import type React from "react"
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "@/hooks/useTheme"
import { Text } from "@/components/ui/Text"
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import { Home, Dumbbell, Compass, User } from "lucide-react-native"

const { width } = Dimensions.get("window")

export interface TabBarProps {
  state: any
  descriptors: any
  navigation: any
}

export const TabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const indicatorStyles = state.routes.map((route, index) => {
    return useAnimatedStyle(() => {
      const isFocused = state.index === index
      return {
        position: "absolute",
        bottom: 0,
        left: (width / state.routes.length) * index + (width / state.routes.length - 20) / 2,
        width: 20,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.primary,
        opacity: withTiming(isFocused ? 1 : 0, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      }
    })
  })

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          paddingBottom: insets.bottom || 16,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name

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

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          })
        }

        // Animated styles for indicator
        // const indicatorStyle = useAnimatedStyle(() => {
        //   return {
        //     position: 'absolute',
        //     bottom: 0,
        //     left: (width / state.routes.length) * index + (width / state.routes.length - 20) / 2,
        //     width: 20,
        //     height: 3,
        //     borderRadius: 1.5,
        //     backgroundColor: colors.primary,
        //     opacity: withTiming(isFocused ? 1 : 0, {
        //       duration: 200,
        //       easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        //     }),
        //   };
        // });

        // Get icon based on route name
        const getIcon = () => {
          const color = isFocused ? colors.primary : colors.textSecondary
          const size = 24

          switch (route.name) {
            case "Home":
              return <Home size={size} color={color} />
            case "Exercises":
              return <Dumbbell size={size} color={color} />
            case "Discover":
              return <Compass size={size} color={color} />
            case "Profile":
              return <User size={size} color={color} />
            default:
              return <Home size={size} color={color} />
          }
        }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {getIcon()}
            <Text
              variant="caption"
              style={[
                styles.label,
                {
                  color: isFocused ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
            <Animated.View style={indicatorStyles[index]} />
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
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 4,
    fontSize: 10,
  },
})
