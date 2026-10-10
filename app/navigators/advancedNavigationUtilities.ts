import { navigationRef, resetRoot } from "./navigationUtilities"
import type { RootStackParamList } from "./types"

/**
 * Navigate to a specific screen with params and reset the navigation stack
 * Useful for flows like authentication where you want to prevent going back
 */
export function navigateAndReset<T extends keyof RootStackParamList>(
  routeName: T,
  params?: RootStackParamList[T],
) {
  if (navigationRef.isReady()) {
    resetRoot({
      index: 0,
      routes: [{ name: routeName, params }],
    })
  }
}

/**
 * Navigate to a nested screen within a tab navigator
 * This handles the complexity of navigating through multiple nested navigators
 */
export function navigateToNestedScreen(
  tab: "HomeTab" | "ExercisesTab" | "DiscoverTab" | "ProfileTab",
  stack: string,
  screen: string,
  params?: Record<string, any>,
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate("MainDrawer", {
      screen: "MainTabs",
      params: {
        screen: tab,
        params: {
          screen: stack,
          params: {
            screen,
            params,
          },
        },
      },
    })
  }
}

/**
 * Navigate to a specific exercise screen from anywhere in the app
 */
export function navigateToExercise(exerciseId: string, exerciseName: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate("Exercise", { id: exerciseId, name: exerciseName })
  }
}

/**
 * Navigate to a specific workout detail screen from anywhere in the app
 */
export function navigateToWorkoutDetail(workoutId: string, workoutName: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate("WorkoutDetail", { id: workoutId, name: workoutName })
  }
}

/**
 * Navigate to the AI coach screen from anywhere in the app
 */
export function navigateToAICoach() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("AICoach")
  }
}

/**
 * Navigate to the voice-enabled workout plan screen from anywhere in the app
 */
export function navigateToVoiceWorkoutPlan() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("VoiceEnabledAIWorkoutPlan")
  }
}

/**
 * Navigate to the profile tab from anywhere in the app
 */
export function navigateToProfile() {
  navigateToNestedScreen("ProfileTab", "Profile", "Profile")
}

/**
 * Navigate to the home tab from anywhere in the app
 */
export function navigateToHome() {
  navigateToNestedScreen("HomeTab", "Home", "Home")
}

/**
 * Navigate to the exercises list from anywhere in the app
 */
export function navigateToExercisesList() {
  navigateToNestedScreen("ExercisesTab", "ExercisesList", "ExercisesList")
}

/**
 * Navigate to the discover tab from anywhere in the app
 */
export function navigateToDiscover() {
  navigateToNestedScreen("DiscoverTab", "Discover", "Discover")
}

/**
 * Handle deep links in the app
 * @param url The deep link URL to handle
 * @returns Whether the deep link was handled
 */
export function handleDeepLink(url: string): boolean {
  if (!url || !navigationRef.isReady()) return false

  // Parse the URL
  try {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname.split("/").filter(Boolean)

    // Handle different deep link paths
    if (path[0] === "exercise" && path[1]) {
      // Example: app://exercise/123/push-ups
      const exerciseId = path[1]
      const exerciseName = path[2] || "Exercise"
      navigateToExercise(exerciseId, exerciseName)
      return true
    }

    if (path[0] === "workout" && path[1]) {
      // Example: app://workout/456/chest-day
      const workoutId = path[1]
      const workoutName = path[2] || "Workout"
      navigateToWorkoutDetail(workoutId, workoutName)
      return true
    }

    if (path[0] === "profile") {
      // Example: app://profile
      navigateToProfile()
      return true
    }

    if (path[0] === "ai-coach") {
      // Example: app://ai-coach
      navigateToAICoach()
      return true
    }
  } catch (error) {
    console.error("Error handling deep link:", error)
  }

  return false
}
