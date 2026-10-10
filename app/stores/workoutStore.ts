import { storage } from "@/utils/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { exerciseApi, workoutApi } from "../services/api"

// Workout store
interface WorkoutState {
  currentWorkout: any | null
  workoutHistory: any[]
  favoriteWorkouts: string[]
  favoriteExercises: string[]
  currentExercise: any | null
  isWorkoutActive: boolean
  workoutStartTime: number | null
  workoutDuration: number
  caloriesBurned: number
  accuracy: number
  setCurrentWorkout: (workout: any) => void
  setCurrentExercise: (exercise: any) => void
  toggleFavoriteWorkout: (workoutId: string) => Promise<boolean>
  toggleFavoriteExercise: (exerciseId: string) => Promise<boolean>
  startWorkout: () => void
  pauseWorkout: () => void
  resumeWorkout: () => void
  completeWorkout: () => void
  resetWorkout: () => void
  updateWorkoutStats: (stats: {
    duration?: number
    caloriesBurned?: number
    accuracy?: number
  }) => void
  loadFavorites: (userId: string) => Promise<void>
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    immer((set, get) => ({
      currentWorkout: null,
      workoutHistory: [],
      favoriteWorkouts: [],
      favoriteExercises: [],
      currentExercise: null,
      isWorkoutActive: false,
      workoutStartTime: null,
      workoutDuration: 0,
      caloriesBurned: 0,
      accuracy: 0,

      setCurrentWorkout: (workout) => {
        set((state) => {
          state.currentWorkout = workout
        })
      },

      setCurrentExercise: (exercise) => {
        set((state) => {
          state.currentExercise = exercise
        })
      },

      toggleFavoriteWorkout: async (workoutId) => {
        try {
          const userId = localStorage.getItem("userId")
          if (!userId) return false

          const isFavorite = await workoutApi.toggleFavorite(userId, workoutId)

          set((state) => {
            if (isFavorite) {
              state.favoriteWorkouts.push(workoutId)
            } else {
              state.favoriteWorkouts = state.favoriteWorkouts.filter((id) => id !== workoutId)
            }
          })

          return isFavorite
        } catch (error) {
          console.error("Error toggling favorite workout:", error)
          return false
        }
      },

      toggleFavoriteExercise: async (exerciseId) => {
        try {
          const userId = localStorage.getItem("userId")
          if (!userId) return false

          const isFavorite = await exerciseApi.toggleFavorite(userId, exerciseId)

          set((state) => {
            if (isFavorite) {
              state.favoriteExercises.push(exerciseId)
            } else {
              state.favoriteExercises = state.favoriteExercises.filter((id) => id !== exerciseId)
            }
          })

          return isFavorite
        } catch (error) {
          console.error("Error toggling favorite exercise:", error)
          return false
        }
      },

      startWorkout: () => {
        set((state) => {
          state.isWorkoutActive = true
          state.workoutStartTime = Date.now()
          state.workoutDuration = 0
          state.caloriesBurned = 0
          state.accuracy = 0
        })
      },

      pauseWorkout: () => {
        set((state) => {
          state.isWorkoutActive = false
        })
      },

      resumeWorkout: () => {
        set((state) => {
          state.isWorkoutActive = true
        })
      },

      completeWorkout: () => {
        const { currentWorkout, workoutDuration, caloriesBurned, accuracy } = get()

        if (currentWorkout) {
          set((state) => {
            state.workoutHistory.unshift({
              id: Date.now().toString(),
              workout: currentWorkout,
              duration: workoutDuration,
              caloriesBurned,
              accuracy,
              completedAt: new Date().toISOString(),
            })

            state.isWorkoutActive = false
            state.currentWorkout = null
            state.currentExercise = null
            state.workoutStartTime = null
          })
        }
      },

      resetWorkout: () => {
        set((state) => {
          state.isWorkoutActive = false
          state.workoutStartTime = null
          state.workoutDuration = 0
          state.caloriesBurned = 0
          state.accuracy = 0
        })
      },

      updateWorkoutStats: (stats) => {
        set((state) => {
          if (stats.duration !== undefined) {
            state.workoutDuration = stats.duration
          }

          if (stats.caloriesBurned !== undefined) {
            state.caloriesBurned = stats.caloriesBurned
          }

          if (stats.accuracy !== undefined) {
            state.accuracy = stats.accuracy
          }
        })
      },

      loadFavorites: async (userId) => {
        try {
          // Load favorite workouts
          const favoriteWorkouts = await workoutApi.getFavoriteWorkouts(userId)
          const workoutIds = favoriteWorkouts.map((workout) => workout.id)

          // Load favorite exercises
          const favoriteExercises = await exerciseApi.getFavoriteExercises(userId)
          const exerciseIds = favoriteExercises.map((exercise) => exercise.id)

          set((state) => {
            state.favoriteWorkouts = workoutIds
            state.favoriteExercises = exerciseIds
          })
        } catch (error) {
          console.error("Error loading favorites:", error)
        }
      },
    })),
    {
      name: "workout-storage",
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
      partialize: (state) => ({
        favoriteWorkouts: state.favoriteWorkouts,
        favoriteExercises: state.favoriteExercises,
        workoutHistory: state.workoutHistory,
      }),
    },
  ),
)
