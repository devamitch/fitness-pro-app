"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { useTheme } from "../theme/theme"
import { CustomDrawer } from "./CustomDrawer"

interface TabletLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  sidebarContent?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

export const TabletLayout: React.FC<TabletLayoutProps> = ({
  children,
  showSidebar = true,
  sidebarContent,
  header,
  footer,
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [isTablet, setIsTablet] = useState(width >= 768)

  // Update isTablet on dimension change
  useEffect(() => {
    setIsTablet(width >= 768)
  }, [width])

  // If not a tablet or sidebar is disabled, just render children
  if (!isTablet || !showSidebar) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {header && <View style={styles.header}>{header}</View>}
        <View style={styles.content}>{children}</View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    )
  }

  // Tablet layout with sidebar
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: insets.top }]}>
      <View style={styles.tabletContainer}>
        {/* Sidebar */}
        <View
          style={[
            styles.sidebar,
            {
              backgroundColor: theme.dark ? "rgba(28, 28, 30, 0.7)" : "rgba(242, 242, 247, 0.7)",
              borderRightColor: theme.colors.card.border,
            },
          ]}
        >
          <BlurView intensity={30} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          {sidebarContent || <CustomDrawer />}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {header && <View style={styles.header}>{header}</View>}
          <View style={styles.content}>{children}</View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabletContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 280,
    height: "100%",
    borderRightWidth: 1,
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    flexDirection: "column",
  },
  header: {
    width: "100%",
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  footer: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
})
