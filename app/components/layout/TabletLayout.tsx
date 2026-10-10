"use client"

import type React from "react"
import { View, StyleSheet, useWindowDimensions } from "react-native"
import { useTheme } from "@/hooks/useTheme"

export interface TabletLayoutProps {
  sidebar?: React.ReactNode
  content: React.ReactNode
  sidebarWidth?: number
  showSidebar?: boolean
}

export const TabletLayout: React.FC<TabletLayoutProps> = ({
  sidebar,
  content,
  sidebarWidth = 300,
  showSidebar = true,
}) => {
  const { colors } = useTheme()
  const { width } = useWindowDimensions()

  // Only show sidebar in tablet mode (width > 768)
  const isTablet = width > 768
  const shouldShowSidebar = isTablet && showSidebar && sidebar

  return (
    <View style={styles.container}>
      {shouldShowSidebar && (
        <View
          style={[
            styles.sidebar,
            {
              width: sidebarWidth,
              backgroundColor: colors.card,
              borderRightColor: colors.border,
            },
          ]}
        >
          {sidebar}
        </View>
      )}

      <View
        style={[
          styles.content,
          {
            width: shouldShowSidebar ? width - sidebarWidth : "100%",
          },
        ]}
      >
        {content}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    height: "100%",
    borderRightWidth: 1,
  },
  content: {
    flex: 1,
  },
})
