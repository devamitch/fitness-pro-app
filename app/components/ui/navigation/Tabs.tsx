"use client"

import { useState, type ReactNode } from "react"
import { TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface TabItem {
  key: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  initialTab?: string
  onChange?: (tabKey: string) => void
  variant?: "default" | "pills" | "underlined"
  scrollable?: boolean
}

export const Tabs = ({ tabs, initialTab, onChange, variant = "default", scrollable = false }: TabsProps) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.key)
  const indicatorPosition = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)

  // Handle tab change
  const handleTabChange = (tab: TabItem, index: number) => {
    setActiveTab(tab.key)
    onChange?.(tab.key)

    // Animate indicator
    if (variant === "underlined") {
      indicatorPosition.value = withTiming(index * 100, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    }
  }

  // Animated style for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
      width: indicatorWidth.value,
    }
  })

  // Get active tab content
  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content

  // Render tab items
  const renderTabs = () => {
    const TabsContainer = scrollable ? ScrollView : Box

    return (
      <TabsContainer
        horizontal={scrollable}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={scrollable ? { flexGrow: 1 } : undefined}
      >
        <Box flexDirection="row" width={scrollable ? undefined : "100%"} position="relative">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key

            // Calculate tab width for indicator
            if (variant === "underlined" && isActive) {
              indicatorWidth.value = 100 / tabs.length
            }

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabChange(tab, index)}
                style={[
                  styles.tabItem,
                  {
                    flex: scrollable ? undefined : 1,
                    paddingHorizontal: scrollable ? 16 : undefined,
                  },
                ]}
              >
                <Box
                  alignItems="center"
                  padding="sm"
                  backgroundColor={variant === "pills" && isActive ? "primary" : "transparent"}
                  borderRadius={variant === "pills" ? "rounded" : "none"}
                >
                  {tab.icon && <Box marginBottom="xs">{tab.icon}</Box>}
                  <Text
                    color={variant === "pills" && isActive ? "white" : isActive ? "primary" : "textSecondary"}
                    variant={isActive ? "bodyBold" : "body"}
                  >
                    {tab.label}
                  </Text>
                </Box>
              </TouchableOpacity>
            )
          })}

          {variant === "underlined" && (
            <Animated.View
              style={[
                styles.indicator,
                indicatorStyle,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${100 / tabs.length}%`,
                },
              ]}
            />
          )}
        </Box>
      </TabsContainer>
    )
  }

  return (
    <Box>
      {renderTabs()}
      <Box marginTop="md">{activeTabContent}</Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
  },
})
