/* eslint-disable import/namespace */
"use client"

import { NotificationsScreen } from "@/screens/NotificationsScreen"
import { VoiceCommandHelpScreen } from "@/screens/VoiceCommandHelpScreen"
import { VoiceSettingsScreen } from "@/screens/VoiceSettingsScreen"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { useWindowDimensions } from "react-native"
import { GlassDrawer } from "../components/ui/navigation/GlassDrawer"
import { TabNavigator } from "./TabNavigator"
import type { DrawerParamList } from "./types"

const Drawer = createDrawerNavigator<DrawerParamList>()

export const DrawerNavigator = () => {
  const dimensions = useWindowDimensions()
  const isLargeScreen = dimensions.width >= 768

  return (
    <Drawer.Navigator
      drawerContent={(props) => <GlassDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isLargeScreen ? "permanent" : "front",
        drawerStyle: isLargeScreen ? { width: "20%" } : { width: "70%" },
        overlayColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="VoiceSettings" component={VoiceSettingsScreen} />
      <Drawer.Screen name="VoiceCommandHelp" component={VoiceCommandHelpScreen} />
    </Drawer.Navigator>
  )
}
