import type { VoiceCommand, CommandCategory } from "../contexts/VoiceAssistantContext"

// Define command options
interface CommandOptions {
  id: string
  phrases: string[]
  category: CommandCategory
  description: string
  examples?: string[]
  isEnabled?: boolean
  requiresAuth?: boolean
  platforms?: ("ios" | "android" | "web")[]
}

// Create voice command HOF
export const createVoiceCommand = (options: CommandOptions, action: (params?: any) => void): VoiceCommand => {
  return {
    id: options.id,
    phrases: options.phrases,
    category: options.category,
    action,
    description: options.description,
    examples: options.examples || options.phrases,
    isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
    requiresAuth: options.requiresAuth,
    platforms: options.platforms,
  }
}

// Create navigation command
export const createNavigationCommand = (
  id: string,
  destination: string,
  navigate: (screen: string) => void,
  phrases?: string[],
): VoiceCommand => {
  return createVoiceCommand(
    {
      id: `navigation_${id}`,
      phrases: phrases || [
        `go to ${destination}`,
        `open ${destination}`,
        `show ${destination}`,
        `navigate to ${destination}`,
      ],
      category: "navigation",
      description: `Navigate to the ${destination} screen`,
      examples: [`"Go to ${destination}"`, `"Open ${destination}"`],
    },
    () => navigate(destination),
  )
}

// Create workout command
export const createWorkoutCommand = (
  id: string,
  workoutName: string,
  startWorkout: (workoutId: string) => void,
  workoutId: string,
  phrases?: string[],
): VoiceCommand => {
  return createVoiceCommand(
    {
      id: `workout_${id}`,
      phrases: phrases || [`start ${workoutName} workout`, `begin ${workoutName}`, `let's do ${workoutName}`],
      category: "workout",
      description: `Start the ${workoutName} workout`,
      examples: [`"Start ${workoutName} workout"`, `"Begin ${workoutName}"`],
      requiresAuth: true,
    },
    () => startWorkout(workoutId),
  )
}

// Create exercise command
export const createExerciseCommand = (
  id: string,
  exerciseName: string,
  showExercise: (exerciseId: string) => void,
  exerciseId: string,
  phrases?: string[],
): VoiceCommand => {
  return createVoiceCommand(
    {
      id: `exercise_${id}`,
      phrases: phrases || [`show ${exerciseName} exercise`, `how to do ${exerciseName}`, `demonstrate ${exerciseName}`],
      category: "exercise",
      description: `Show how to perform the ${exerciseName} exercise`,
      examples: [`"Show ${exerciseName} exercise"`, `"How to do ${exerciseName}"`],
    },
    () => showExercise(exerciseId),
  )
}

// Create settings command
export const createSettingsCommand = (
  id: string,
  settingName: string,
  updateSetting: (value: any) => void,
  value: any,
  phrases?: string[],
): VoiceCommand => {
  return createVoiceCommand(
    {
      id: `settings_${id}`,
      phrases: phrases || [
        `set ${settingName} to ${value}`,
        `change ${settingName} to ${value}`,
        `update ${settingName} to ${value}`,
      ],
      category: "settings",
      description: `Set ${settingName} to ${value}`,
      examples: [`"Set ${settingName} to ${value}"`, `"Change ${settingName} to ${value}"`],
    },
    () => updateSetting(value),
  )
}
