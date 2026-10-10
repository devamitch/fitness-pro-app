"use client"

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { HomeNavigator } from "./HomeNavigator"
import { ExercisesNavigator } from "./ExercisesNavigator"
import { DiscoverNavigator } from "./DiscoverNavigator"
import { ProfileNavigator } from "./ProfileNavigator"
import { Home, Dumbbell, Compass, User } from "lucide-react-native"
import { useTheme } from "../theme"
import type { TabParamList } from "./types"
import { GlassTabBar } from "../components/ui/navigation/GlassTabBar"
import { GradientIcon } from "../components/ui/premium/GradientIcon"

const Tab = createBottomTabNavigator<TabParamList>()

export const TabNavigator = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <GlassTabBar
          items={[
            {
              key: "HomeTab",
              label: "Home",
              icon: <Home size={24} color={theme.colors.textMuted} />,
              activeIcon: <GradientIcon icon={<Home size={24} color="#fff" />} />,
            },
            {
              key: "ExercisesTab",
              label: "Exercises",
              icon: <Dumbbell size={24} color={theme.colors.textMuted} />,
              activeIcon: <GradientIcon icon={<Dumbbell size={24} color="#fff" />} />,
            },
            {
              key: "DiscoverTab",
              label: "Discover",
              icon: <Compass size={24} color={theme.colors.textMuted} />,
              activeIcon: <GradientIcon icon={<Compass size={24} color="#fff" />} />,
            },
            {
              key: "ProfileTab",
              label: "Profile",
              icon: <User size={24} color={theme.colors.textMuted} />,
              activeIcon: <GradientIcon icon={<User size={24} color="#fff" />} />,
            },
          ]}
          activeKey={props.state.routes[props.state.index].name}
          onChange={(key) => {
            const index = props.state.routes.findIndex((route) => route.name === key)
            props.navigation.navigate(props.state.routes[index].name)
          }}
        />
      )}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="ExercisesTab" component={ExercisesNavigator} />
      <Tab.Screen name="DiscoverTab" component={DiscoverNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  )
}
