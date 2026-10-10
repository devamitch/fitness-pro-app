/* eslint-disable @typescript-eslint/no-namespace */
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import type { DrawerScreenProps } from "@react-navigation/drawer"
import type { NavigationState, NavigatorScreenParams, PartialState } from "@react-navigation/native"
import type { StackScreenProps } from "@react-navigation/stack"

// Root Stack (main app navigator)
export type RootStackParamList = {
  Splash: undefined
  Auth: undefined
  Onboarding: undefined
  OnboardingQuestionnaire: undefined
  MainDrawer: NavigatorScreenParams<DrawerParamList>
  Exercise: { id: string; name: string }
  EnhancedExercise: { id: string; name: string }
  WorkoutDetail: { id: string; name: string }
  Tutorial: undefined
  ExerciseRecommendations: undefined
  Chat: undefined
  AICoach: undefined
  VoiceRecording: undefined
  VoiceComponentsShowcase: undefined
  VoiceEnabledHome: undefined
  VoiceEnabledAIWorkoutPlan: undefined
  SavedWorkoutPlans: undefined
  WorkoutPlanDetail: { id: string; name: string }
}

// Drawer Navigator
export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>
  Notifications: undefined
  VoiceSettings: undefined
  VoiceCommandHelp: undefined
}

// Bottom Tab Navigator
export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>
  ExercisesTab: NavigatorScreenParams<ExercisesStackParamList>
  DiscoverTab: NavigatorScreenParams<DiscoverStackParamList>
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>
}

// Home Stack
export type HomeStackParamList = {
  Home: undefined
  WorkoutDetail: { id: string; name: string }
  Exercise: { id: string; name: string }
  Chat: undefined
  Notifications: undefined
}

// Exercises Stack
export type ExercisesStackParamList = {
  ExercisesList: undefined
  Exercise: { exerciseId: string; exerciseName: string }
  EnhancedExercise: { exerciseId: string; exerciseName: string }
  PremiumExercise: { exerciseId: string; exerciseName: string }
  PremiumExerciseTracking: {
    exerciseId: string
    exerciseName: string
    instructions?: string
    difficulty?: "beginner" | "intermediate" | "advanced"
  }
  TensorFlowPose: {
    modelType?: "posenet" | "movenet" | "blazepose" | "custom"
  }
  ExerciseRecommendations: undefined
}

// Discover Stack
export type DiscoverStackParamList = {
  Discover: undefined
  WorkoutDetail: { id: string; name: string }
  Exercise: { id: string; name: string }
}

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined
  EditProfile: undefined
  AccountSettings: undefined
  NotificationSettings: undefined
  AppSettings: undefined
  Help: undefined
}

// Helper types for useNavigation, useRoute, etc.
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>

export type DrawerScreenPropsType<T extends keyof DrawerParamList> = DrawerScreenProps<
  DrawerParamList,
  T
>

export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = StackScreenProps<
  HomeStackParamList,
  T
>

export type ExercisesStackScreenProps<T extends keyof ExercisesStackParamList> = StackScreenProps<
  ExercisesStackParamList,
  T
>

export type DiscoverStackScreenProps<T extends keyof DiscoverStackParamList> = StackScreenProps<
  DiscoverStackParamList,
  T
>

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = StackScreenProps<
  ProfileStackParamList,
  T
>

// Declare global types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Use this function to get the active route name from navigation state
export function getActiveRouteName(state: NavigationState | PartialState<NavigationState>): string {
  const route = state.routes[state.index ?? 0]

  // Found the active route -- return the name
  if (!route.state) return route.name

  // Recursive call to deal with nested routers
  return getActiveRouteName(route.state as NavigationState)
}
