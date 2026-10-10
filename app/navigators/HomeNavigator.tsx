"use client"

import { createStackNavigator } from "@react-navigation/stack"
// import { HomeScreen } from "../screens/home/HomeScreen"
// import { WorkoutDetailScreen } from "../screens/home/WorkoutDetailScreen"
// import { ExerciseScreen } from "../screens/exercise/ExerciseScreen"
// import { ChatScreen } from "../screens/chat/ChatScreen"
// import { NotificationsScreen } from "../screens/notifications/NotificationsScreen"
import { ChatScreen } from "@/screens/ChatScreen"
import { ExerciseScreen } from "@/screens/ExerciseScreen"
import { HomeScreen } from "@/screens/HomeScreen"
import { NotificationsScreen } from "@/screens/NotificationsScreen"
import { WorkoutDetailScreen } from "@/screens/WorkoutDetailScreen"
import { glassmorphismTransition } from "./transitions/screenTransitions"
import type { HomeStackParamList } from "./types"

const Stack = createStackNavigator<HomeStackParamList>()

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...glassmorphismTransition,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  )
}
