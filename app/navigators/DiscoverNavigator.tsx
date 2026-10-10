"use client"

import { createStackNavigator } from "@react-navigation/stack"
// import { DiscoverScreen } from "../screens/discover/DiscoverScreen"
// import { WorkoutDetailScreen } from "../screens/home/WorkoutDetailScreen"
// import { ExerciseScreen } from "../screens/exercise/ExerciseScreen"
import { ExerciseScreen } from "@/screens/ExerciseScreen"
import { glassmorphismTransition } from "./transitions/screenTransitions"
import type { DiscoverStackParamList } from "./types"

const Stack = createStackNavigator<DiscoverStackParamList>()

export const DiscoverNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...glassmorphismTransition,
      }}
    >
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
    </Stack.Navigator>
  )
}
