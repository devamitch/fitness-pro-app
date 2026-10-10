"use client"

import { createStackNavigator } from "@react-navigation/stack"
// import { ExercisesListScreen } from "../screens/exercise/ExercisesListScreen"
// import { ExerciseScreen } from "../screens/exercise/ExerciseScreen"
// import { EnhancedExerciseScreen } from "../screens/exercise/EnhancedExerciseScreen"
// import { PremiumExerciseScreen } from "../screens/exercise/PremiumExerciseScreen"
// import { PremiumExerciseTrackingScreen } from "../screens/exercise/PremiumExerciseTrackingScreen"
// import { TensorFlowPoseScreen } from "../screens/exercise/TensorFlowPoseScreen"
// import { ExerciseRecommendationsScreen } from "../screens/exercise/ExerciseRecommendationsScreen"
import EnhancedExerciseScreen from "@/screens/EnhancedExerciseScreen"
import { ExerciseRecommendationsScreen } from "@/screens/ExerciseRecommendationsScreen"
import { ExerciseScreen } from "@/screens/ExerciseScreen"
import { ExercisesListScreen } from "@/screens/ExercisesListScreen"
import { PremiumExerciseScreen } from "@/screens/PremiumExerciseScreen"
import PremiumExerciseTrackingScreen from "@/screens/PremiumExerciseTrackingScreen"
import TensorFlowPoseScreen from "@/screens/TensorFlowPoseScreen"
import { glassmorphismTransition } from "./transitions/screenTransitions"
import type { ExercisesStackParamList } from "./types"

const Stack = createStackNavigator<ExercisesStackParamList>()

export const ExercisesNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...glassmorphismTransition,
      }}
    >
      <Stack.Screen name="ExercisesList" component={ExercisesListScreen} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
      <Stack.Screen name="EnhancedExercise" component={EnhancedExerciseScreen} />
      <Stack.Screen name="PremiumExercise" component={PremiumExerciseScreen} />
      <Stack.Screen name="PremiumExerciseTracking" component={PremiumExerciseTrackingScreen} />
      <Stack.Screen name="TensorFlowPose" component={TensorFlowPoseScreen} />
      <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
    </Stack.Navigator>
  )
}
