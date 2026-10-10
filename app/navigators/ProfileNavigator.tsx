"use client"

import { createStackNavigator } from "@react-navigation/stack"
import { ProfileScreen } from "../screens/profile/ProfileScreen"
import { EditProfileScreen } from "../screens/profile/EditProfileScreen"
import { AccountSettingsScreen } from "../screens/settings/AccountSettingsScreen"
import { NotificationSettingsScreen } from "../screens/settings/NotificationSettingsScreen"
import { AppSettingsScreen } from "../screens/settings/AppSettingsScreen"
import { HelpScreen } from "../screens/help/HelpScreen"
import type { ProfileStackParamList } from "./types"
import { glassmorphismTransition } from "./transitions/screenTransitions"

const Stack = createStackNavigator<ProfileStackParamList>()

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...glassmorphismTransition,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  )
}
