import type { NavigatorScreenParams } from "@react-navigation/native"

// Define the param lists for each navigator
export type RootStackParamList = {
  Onboarding: undefined
  Auth: undefined
  Main: NavigatorScreenParams<DrawerParamList>
  Exercise: { id: string; name: string }
  WorkoutDetail: { id: string; name: string }
  Chat: undefined
}

export type DrawerParamList = {
  HomeDrawer: NavigatorScreenParams<TabParamList>
  ExercisesDrawer: undefined
  NotificationsDrawer: undefined
  SettingsDrawer: undefined
  HelpDrawer: undefined
}

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>
  ExercisesTab: NavigatorScreenParams<ExercisesStackParamList>
  DiscoverTab: NavigatorScreenParams<DiscoverStackParamList>
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>
}

export type HomeStackParamList = {
  Home: undefined
  WorkoutDetail: { id: string; name: string }
  Exercise: { id: string; name: string }
  Chat: undefined
  Notifications: undefined
}

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

export type DiscoverStackParamList = {
  Discover: undefined
  WorkoutDetail: { id: string; name: string }
  Exercise: { id: string; name: string }
}

export type ProfileStackParamList = {
  Profile: undefined
  EditProfile: undefined
  AccountSettings: undefined
  NotificationSettings: undefined
  AppSettings: undefined
  Help: undefined
}

// Declare the navigation types to be used throughout the app
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
