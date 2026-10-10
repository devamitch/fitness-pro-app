"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { useAuthStore } from "../stores/authStore"
import { DrawerNavigator } from "./DrawerNavigator"
import { SplashScreen } from "../screens/startup/SplashScreen"
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen"
import { OnboardingQuestionnaireScreen } from "../screens/onboarding/OnboardingQuestionnaireScreen"
import { AuthScreen } from "../screens/auth/AuthScreen"
import { ExerciseScreen } from "../screens/exercise/ExerciseScreen"
import { EnhancedExerciseScreen } from "../screens/exercise/EnhancedExerciseScreen"
import { WorkoutDetailScreen } from "../screens/home/WorkoutDetailScreen"
import { TutorialScreen } from "../screens/tutorial/TutorialScreen"
import { ExerciseRecommendationsScreen } from "../screens/exercise/ExerciseRecommendationsScreen"
import { ChatScreen } from "../screens/chat/ChatScreen"
import { AICoachScreen } from "../screens/ai/AICoachScreen"
import { VoiceRecordingScreen } from "../screens/voice/VoiceRecordingScreen"
import { VoiceComponentsShowcaseScreen } from "../screens/voice/VoiceComponentsShowcaseScreen"
import { VoiceEnabledHomeScreen } from "../screens/voice/VoiceEnabledHomeScreen"
import { VoiceEnabledAIWorkoutPlanScreen } from "../screens/ai/VoiceEnabledAIWorkoutPlanScreen"
import { SavedWorkoutPlansScreen } from "../screens/workout/SavedWorkoutPlansScreen"
import { WorkoutPlanDetailScreen } from "../screens/workout/WorkoutPlanDetailScreen"
import { navigationRef, useBackButtonHandler, useNavigationPersistence } from "./navigationUtilities"
import { NavigationErrorBoundary } from "./NavigationErrorBoundary"
import { DeepLinkHandler } from "./DeepLinkHandler"
import { glassmorphismTransition } from "./transitions/screenTransitions"
import type { RootStackParamList } from "./types"
import * as storage from "../utils/storage"

const Stack = createStackNavigator<RootStackParamList>()

export const AppNavigator = () => {
  const { initialized, authenticated, onboarded } = useAuthStore()

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
    <NavigationErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
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
              <Stack.Screen name="OnboardingQuestionnaire" component={OnboardingQuestionnaireScreen} />
            </>
          ) : (
            // Main app flow
            <>
              <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
              <Stack.Screen name="Exercise" component={ExerciseScreen} />
              <Stack.Screen name="EnhancedExercise" component={EnhancedExerciseScreen} />
              <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
              <Stack.Screen name="Tutorial" component={TutorialScreen} />
              <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="AICoach" component={AICoachScreen} />
              <Stack.Screen name="VoiceRecording" component={VoiceRecordingScreen} />
              <Stack.Screen name="VoiceComponentsShowcase" component={VoiceComponentsShowcaseScreen} />
              <Stack.Screen name="VoiceEnabledHome" component={VoiceEnabledHomeScreen} />
              <Stack.Screen name="VoiceEnabledAIWorkoutPlan" component={VoiceEnabledAIWorkoutPlanScreen} />
              <Stack.Screen name="SavedWorkoutPlans" component={SavedWorkoutPlansScreen} />
              <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetailScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationErrorBoundary>
  )
}
