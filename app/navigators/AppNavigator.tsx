"use client"

import { AICoachScreen } from "@/screens/AICoachScreen"
import { AuthScreen } from "@/screens/AuthScreen"
import { ChatScreen } from "@/screens/ChatScreen"
import EnhancedExerciseScreen from "@/screens/EnhancedExerciseScreen"
import { ExerciseRecommendationsScreen } from "@/screens/ExerciseRecommendationsScreen"
import { ExerciseScreen } from "@/screens/ExerciseScreen"
import { OnboardingQuestionnaireScreen } from "@/screens/OnboardingQuestionnaireScreen"
import { OnboardingScreen } from "@/screens/OnboardingScreen"
import SavedWorkoutPlansScreen from "@/screens/SavedWorkoutPlansScreen"
import { SplashScreen } from "@/screens/SplashScreen"
import { TutorialScreen } from "@/screens/TutorialScreen"
import { VoiceComponentsShowcaseScreen } from "@/screens/VoiceComponentsShowcaseScreen"
import VoiceEnabledAIWorkoutPlanScreen from "@/screens/VoiceEnabledAIWorkoutPlanScreen"
import { VoiceEnabledHomeScreen } from "@/screens/VoiceEnabledHomeScreen"
import { VoiceRecordingScreen } from "@/screens/VoiceRecordingScreen"
import { WorkoutDetailScreen } from "@/screens/WorkoutDetailScreen"
import WorkoutPlanDetailScreen from "@/screens/WorkoutPlanDetailScreen"
import { createStackNavigator } from "@react-navigation/stack"
// import { AICoachScreen } from "@/screens/ai/AICoachScreen"
// import { NavigationContainer } from "@react-navigation/native"
// import { createStackNavigator } from "@react-navigation/stack"
// import { VoiceEnabledAIWorkoutPlanScreen } from "../screens/ai/VoiceEnabledAIWorkoutPlanScreen"
// import { AuthScreen } from "../screens/auth/AuthScreen"
// import { ChatScreen } from "../screens/chat/ChatScreen"
// import { EnhancedExerciseScreen } from "../screens/exercise/EnhancedExerciseScreen"
// import { ExerciseRecommendationsScreen } from "../screens/exercise/ExerciseRecommendationsScreen"
// import { ExerciseScreen } from "../screens/exercise/ExerciseScreen"
// import { WorkoutDetailScreen } from "../screens/home/WorkoutDetailScreen"
// import { OnboardingQuestionnaireScreen } from "../screens/onboarding/OnboardingQuestionnaireScreen"
// import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen"
// import { SplashScreen } from "../screens/startup/SplashScreen"
// import { TutorialScreen } from "../screens/tutorial/TutorialScreen"
// import { VoiceComponentsShowcaseScreen } from "../screens/voice/VoiceComponentsShowcaseScreen"
// import { VoiceEnabledHomeScreen } from "../screens/voice/VoiceEnabledHomeScreen"
// import { VoiceRecordingScreen } from "../screens/voice/VoiceRecordingScreen"
// import { SavedWorkoutPlansScreen } from "../screens/workout/SavedWorkoutPlansScreen"
// import { WorkoutPlanDetailScreen } from "../screens/workout/WorkoutPlanDetailScreen"
import { ThemeProvider } from "@/theme/ThemeProvider"
import { NavigationThemeProvider } from "@/theme/navigation-theme-provider"
import { useColorScheme } from "react-native"
import { useAuthStore } from "../stores/authStore"
import * as storage from "../utils/storage"
import { DeepLinkHandler } from "./DeepLinkHandler"
import { DrawerNavigator } from "./DrawerNavigator"
import { NavigationErrorBoundary } from "./NavigationErrorBoundary"
import {
  navigationRef,
  useBackButtonHandler,
  useNavigationPersistence,
} from "./navigationUtilities"
import { glassmorphismTransition } from "./transitions/screenTransitions"
import type { RootStackParamList } from "./types"

const Stack = createStackNavigator<RootStackParamList>()

export const AppNavigator = () => {
  const { initialized, authenticated, onboarded } = useAuthStore()
  const colorScheme = useColorScheme()

  useBackButtonHandler((routeName) => {
    // Exit when on Auth screen
    return routeName === "Auth"
  })

  const { initialNavigationState, onNavigationStateChange, isRestored } = useNavigationPersistence(
    storage,
    "navigation",
  )

  // Show splash screen while initializing
  if (!initialized) {
    return <SplashScreen />
  }

  return (
    <ThemeProvider colorScheme={colorScheme}>
      <NavigationErrorBoundary>
        <NavigationThemeProvider
          navigationRef={navigationRef}
          initialState={initialNavigationState}
          onStateChange={onNavigationStateChange}
          fallback={<SplashScreen />}
        >
          {/* Handle deep links */}
          <DeepLinkHandler enabled={authenticated && onboarded} />

          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              ...glassmorphismTransition, // Apply glassmorphism transition
            }}
          >
            {!authenticated ? (
              // Auth flow
              <>
                <Stack.Screen name="Auth" component={AuthScreen} />
              </>
            ) : !onboarded ? (
              // Onboarding flow
              <>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen
                  name="OnboardingQuestionnaire"
                  component={OnboardingQuestionnaireScreen}
                />
              </>
            ) : (
              // Main app flow
              <>
                <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
                <Stack.Screen name="Exercise" component={ExerciseScreen} />
                <Stack.Screen name="EnhancedExercise" component={EnhancedExerciseScreen} />
                <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
                <Stack.Screen name="Tutorial" component={TutorialScreen} />
                <Stack.Screen
                  name="ExerciseRecommendations"
                  component={ExerciseRecommendationsScreen}
                />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="AICoach" component={AICoachScreen} />
                <Stack.Screen name="VoiceRecording" component={VoiceRecordingScreen} />
                <Stack.Screen
                  name="VoiceComponentsShowcase"
                  component={VoiceComponentsShowcaseScreen}
                />
                <Stack.Screen name="VoiceEnabledHome" component={VoiceEnabledHomeScreen} />
                <Stack.Screen
                  name="VoiceEnabledAIWorkoutPlan"
                  component={VoiceEnabledAIWorkoutPlanScreen}
                />
                <Stack.Screen name="SavedWorkoutPlans" component={SavedWorkoutPlansScreen} />
                <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetailScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationThemeProvider>
      </NavigationErrorBoundary>
    </ThemeProvider>
  )
}
