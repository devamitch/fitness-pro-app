import { storage } from "@/utils/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Define user preferences types
export type FitnessLevel = "beginner" | "intermediate" | "advanced"
export type FitnessGoal =
  | "weight_loss"
  | "muscle_gain"
  | "flexibility"
  | "posture"
  | "general_fitness"
export type WorkoutFrequency = "1-2" | "3-4" | "5+"
export type WorkoutDuration = "15" | "30" | "45" | "60+"
export type ProblemArea = "neck" | "shoulders" | "back" | "hips" | "knees" | "ankles"

export interface UserPreferences {
  fitness_level: FitnessLevel | null
  fitness_goals: FitnessGoal[]
  workout_frequency: WorkoutFrequency | null
  workout_duration: WorkoutDuration | null
  problem_areas: ProblemArea[]
}

interface UserPreferencesState {
  preferences: UserPreferences | null
  recommendedExercises: any[] // Will be populated from OpenAI
  recommendedWorkouts: any[] // Will be populated from OpenAI
  setUserPreferences: (preferences: UserPreferences) => void
  setRecommendedExercises: (exercises: any[]) => void
  setRecommendedWorkouts: (workouts: any[]) => void
  clearPreferences: () => void
}

const initialPreferences: UserPreferences = {
  fitness_level: null,
  fitness_goals: [],
  workout_frequency: null,
  workout_duration: null,
  problem_areas: [],
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      preferences: null,
      recommendedExercises: [],
      recommendedWorkouts: [],
      setUserPreferences: (preferences) => set({ preferences }),
      setRecommendedExercises: (exercises) => set({ recommendedExercises: exercises }),
      setRecommendedWorkouts: (workouts) => set({ recommendedWorkouts: workouts }),
      clearPreferences: () =>
        set({
          preferences: initialPreferences,
          recommendedExercises: [],
          recommendedWorkouts: [],
        }),
    }),
    {
      name: "user-preferences-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name)
          return value ? Promise.resolve(JSON.parse(value)) : Promise.resolve(null)
        },
        setItem: (name, value) => {
          storage.set(name, JSON.stringify(value))
          return Promise.resolve()
        },
        removeItem: (name) => {
          storage.delete(name)
          return Promise.resolve()
        },
      })),
    },
  ),
)
