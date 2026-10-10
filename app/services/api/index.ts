// import { userService } from "./userService"
// import { workoutService } from "./workoutService"
// import { exerciseService } from "./exerciseService"
import { aiCoachService } from "./aiCoachService"
// import { socialService } from "./socialService"
// import { liveSessionService } from "./liveSessionService"
import { useAuthStore } from "@/stores"
import { Database } from "@/types/supabase"
import { storage } from "@/utils/storage"
import { createClient } from "@supabase/supabase-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import supabaseClient from "../supabase"
import { trackingService } from "./trackingService"

// Types
export interface Exercise {
  id: string
  name: string
  description: string
  duration: number
  calories: number
  difficulty: "beginner" | "intermediate" | "advanced"
  muscle_group: string
  video_url: string
  thumbnail_url: string
  instructions: string[]
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  name: string
  description: string
  duration: number
  calories: number
  difficulty: "beginner" | "intermediate" | "advanced"
  category: string
  image_url: string
  created_at: string
  updated_at: string
  workout_exercises?: WorkoutExercise[]
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  order_index: number
  sets: number
  reps: number
  duration: number
  rest: number
  created_at: string
  updated_at: string
  exercises?: Exercise
}

export interface UserProgress {
  id: string
  user_id: string
  exercise_id: string
  workout_id?: string
  duration: number
  accuracy: number
  calories_burned: number
  completed_at: string
  created_at: string
  exercises?: Exercise
}

export interface UserPreferences {
  id: string
  user_id: string
  fitness_level: "beginner" | "intermediate" | "advanced"
  goals: string[]
  preferred_workout_duration: number
  workout_days: string[]
  focus_areas: string[]
  created_at: string
  updated_at: string
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ""

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Add auth token to Supabase requests
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) {
    useAuthStore.getState().setUser({
      id: session.user.id,
      email: session.user.email || "",
      username: session.user.user_metadata.username || "",
      avatarUrl: session.user.user_metadata.avatar_url,
    })
    useAuthStore.getState().setToken(session.access_token)
  }

  if (event === "SIGNED_OUT") {
    useAuthStore.getState().signOut()
  }
})

// API cache store
interface ApiCacheState {
  cache: Record<string, any>
  setCache: (key: string, data: any) => void
  getCache: (key: string) => any
  clearCache: (key?: string) => void
}

export const useApiCacheStore = create<ApiCacheState>()(
  persist(
    immer((set, get) => ({
      cache: {},
      setCache: (key, data) =>
        set((state) => {
          state.cache[key] = {
            data,
            timestamp: Date.now(),
          }
        }),
      getCache: (key) => {
        const cached = get().cache[key]
        if (!cached) return null

        // Cache expires after 5 minutes
        const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000
        return isExpired ? null : cached.data
      },
      clearCache: (key) =>
        set((state) => {
          if (key) {
            delete state.cache[key]
          } else {
            state.cache = {}
          }
        }),
    })),
    {
      name: "api-cache",
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

// API service for exercises
export const exerciseApi = {
  getExercises: async () => {
    const cacheKey = "exercises"
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase.from("exercises").select("*, categories(*)")

    if (error) throw error

    useApiCacheStore.getState().setCache(cacheKey, data)
    return data
  },

  getExerciseById: async (id: string) => {
    const cacheKey = `exercise-${id}`
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase
      .from("exercises")
      .select("*, categories(*)")
      .eq("id", id)
      .single()

    if (error) throw error

    useApiCacheStore.getState().setCache(cacheKey, data)
    return data
  },

  getFavoriteExercises: async (userId: string) => {
    const cacheKey = `favorite-exercises-${userId}`
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase
      .from("user_favorites")
      .select("*, exercises(*)")
      .eq("user_id", userId)
      .not("exercise_id", "is", null)

    if (error) throw error

    const exercises = data.map((item) => item.exercises)
    useApiCacheStore.getState().setCache(cacheKey, exercises)
    return exercises
  },

  toggleFavorite: async (userId: string, exerciseId: string) => {
    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .single()

    if (checkError && checkError.code !== "PGRST116") throw checkError

    if (existing) {
      // Remove from favorites
      const { error } = await supabase.from("user_favorites").delete().eq("id", existing.id)

      if (error) throw error
    } else {
      // Add to favorites
      const { error } = await supabase.from("user_favorites").insert({
        user_id: userId,
        exercise_id: exerciseId,
      })

      if (error) throw error
    }

    // Clear cache
    useApiCacheStore.getState().clearCache(`favorite-exercises-${userId}`)

    return !existing
  },
}

// Exercise API
export const useExerciseApi = () => {
  const queryClient = useQueryClient()

  // Get all exercises
  const useGetExercises = (filters?: {
    muscle_group?: string
    difficulty?: string
    search?: string
  }) => {
    return useQuery<Exercise[], Error>(["exercises", filters], async () => {
      let query = supabaseClient.from("exercises").select("*")

      if (filters?.muscle_group) {
        query = query.eq("muscle_group", filters.muscle_group)
      }

      if (filters?.difficulty) {
        query = query.eq("difficulty", filters.difficulty)
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`)
      }

      const { data, error } = await query.order("name")

      if (error) throw error
      return data
    })
  }

  // Get exercise by ID
  const useGetExerciseById = (id?: string) => {
    return useQuery<Exercise, Error>(
      ["exercise", id],
      async () => {
        if (!id) throw new Error("Exercise ID is required")

        const { data, error } = await supabaseClient
          .from("exercises")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        return data
      },
      {
        enabled: !!id,
      },
    )
  }

  // Get favorite exercises
  const useGetFavoriteExercises = (userId?: string) => {
    return useQuery<Exercise[], Error>(
      ["favoriteExercises", userId],
      async () => {
        if (!userId) throw new Error("User ID is required")

        const { data, error } = await supabaseClient
          .from("user_favorite_exercises")
          .select("exercises(*)")
          .eq("user_id", userId)

        if (error) throw error
        return data.map((item) => item.exercises)
      },
      {
        enabled: !!userId,
      },
    )
  }

  // Toggle favorite exercise
  const useToggleFavoriteExercise = () => {
    return useMutation<void, Error, { userId: string; exerciseId: string; isFavorite: boolean }>(
      async ({ userId, exerciseId, isFavorite }) => {
        if (isFavorite) {
          // Remove from favorites
          const { error } = await supabaseClient
            .from("user_favorite_exercises")
            .delete()
            .eq("user_id", userId)
            .eq("exercise_id", exerciseId)

          if (error) throw error
        } else {
          // Add to favorites
          const { error } = await supabaseClient
            .from("user_favorite_exercises")
            .insert({ user_id: userId, exercise_id: exerciseId })

          if (error) throw error
        }
      },
      {
        onSuccess: (_, { userId }) => {
          queryClient.invalidateQueries(["favoriteExercises", userId])
        },
      },
    )
  }

  return {
    useGetExercises,
    useGetExerciseById,
    useGetFavoriteExercises,
    useToggleFavoriteExercise,
  }
}

// API service for workouts
export const workoutApi = {
  getWorkouts: async () => {
    const cacheKey = "workouts"
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase.from("workouts").select("*")

    if (error) throw error

    useApiCacheStore.getState().setCache(cacheKey, data)
    return data
  },

  getWorkoutById: async (id: string) => {
    const cacheKey = `workout-${id}`
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase
      .from("workouts")
      .select("*, workout_exercises(*, exercises(*))")
      .eq("id", id)
      .single()

    if (error) throw error

    useApiCacheStore.getState().setCache(cacheKey, data)
    return data
  },

  getFavoriteWorkouts: async (userId: string) => {
    const cacheKey = `favorite-workouts-${userId}`
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase
      .from("user_favorites")
      .select("*, workouts(*)")
      .eq("user_id", userId)
      .not("workout_id", "is", null)

    if (error) throw error

    const workouts = data.map((item) => item.workouts)
    useApiCacheStore.getState().setCache(cacheKey, workouts)
    return workouts
  },

  toggleFavorite: async (userId: string, workoutId: string) => {
    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("workout_id", workoutId)
      .single()

    if (checkError && checkError.code !== "PGRST116") throw checkError

    if (existing) {
      // Remove from favorites
      const { error } = await supabase.from("user_favorites").delete().eq("id", existing.id)

      if (error) throw error
    } else {
      // Add to favorites
      const { error } = await supabase.from("user_favorites").insert({
        user_id: userId,
        workout_id: workoutId,
      })

      if (error) throw error
    }

    // Clear cache
    useApiCacheStore.getState().clearCache(`favorite-workouts-${userId}`)

    return !existing
  },
}

// Workout API
export const useWorkoutApi = () => {
  const queryClient = useQueryClient()

  // Get all workouts
  const useGetWorkouts = (filters?: {
    category?: string
    difficulty?: string
    search?: string
  }) => {
    return useQuery<Workout[], Error>(["workouts", filters], async () => {
      let query = supabaseClient.from("workouts").select("*")

      if (filters?.category) {
        query = query.eq("category", filters.category)
      }

      if (filters?.difficulty) {
        query = query.eq("difficulty", filters.difficulty)
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`)
      }

      const { data, error } = await query.order("name")

      if (error) throw error
      return data
    })
  }

  // Get workout by ID
  const useGetWorkoutById = (id?: string) => {
    return useQuery<Workout, Error>(
      ["workout", id],
      async () => {
        if (!id) throw new Error("Workout ID is required")

        const { data, error } = await supabaseClient
          .from("workouts")
          .select(
            `
            *,
            workout_exercises(
              *,
              exercises(*)
            )
          `,
          )
          .eq("id", id)
          .single()

        if (error) throw error
        return data
      },
      {
        enabled: !!id,
      },
    )
  }

  // Get user workouts
  const useGetUserWorkouts = (userId?: string) => {
    return useQuery<Workout[], Error>(
      ["userWorkouts", userId],
      async () => {
        if (!userId) throw new Error("User ID is required")

        const { data, error } = await supabaseClient
          .from("user_workouts")
          .select(
            `
            workouts(
              *,
              workout_exercises(
                *,
                exercises(*)
              )
            )
          `,
          )
          .eq("user_id", userId)

        if (error) throw error
        return data.map((item) => item.workouts)
      },
      {
        enabled: !!userId,
      },
    )
  }

  return {
    useGetWorkouts,
    useGetWorkoutById,
    useGetUserWorkouts,
  }
}

// API service for user progress
export const progressApi = {
  saveProgress: async (progress: {
    user_id: string
    exercise_id: string
    duration: number
    accuracy: number
    calories_burned: number
  }) => {
    const { data, error } = await supabase.from("user_progress").insert(progress).select().single()

    if (error) throw error

    // Clear cache
    useApiCacheStore.getState().clearCache(`progress-${progress.user_id}`)

    return data
  },

  getUserProgress: async (userId: string) => {
    const cacheKey = `progress-${userId}`
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase
      .from("user_progress")
      .select("*, exercises(*)")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (error) throw error

    useApiCacheStore.getState().setCache(cacheKey, data)
    return data
  },
}

// Progress API
export const useProgressApi = () => {
  const queryClient = useQueryClient()

  // Get user progress
  const useGetUserProgress = (userId?: string) => {
    return useQuery<UserProgress[], Error>(
      ["userProgress", userId],
      async () => {
        if (!userId) throw new Error("User ID is required")

        const { data, error } = await supabaseClient
          .from("user_progress")
          .select(
            `
            *,
            exercises(*)
          `,
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })

        if (error) throw error
        return data
      },
      {
        enabled: !!userId,
      },
    )
  }

  // Save progress
  const saveProgress = async (
    progress: Omit<UserProgress, "id" | "created_at" | "completed_at">,
  ) => {
    const { data, error } = await supabaseClient
      .from("user_progress")
      .insert({
        ...progress,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  return {
    useGetUserProgress,
    saveProgress,
  }
}

// API service for notifications
export const notificationApi = {
  getNotifications: async (userId: string) => {
    const cacheKey = `notifications-${userId}`
    const cached = useApiCacheStore.getState().getCache(cacheKey)

    if (cached) return cached

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    useApiCacheStore.getState().setCache(cacheKey, data)
    return data
  },

  markAsRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()
      .single()

    if (error) throw error

    // Clear cache
    const userId = useAuthStore.getState().user?.id
    if (userId) {
      useApiCacheStore.getState().clearCache(`notifications-${userId}`)
    }

    return data
  },
}

// User Preferences API
export const useUserPreferencesApi = () => {
  const queryClient = useQueryClient()

  // Get user preferences
  const useGetUserPreferences = (userId?: string) => {
    return useQuery<UserPreferences, Error>(
      ["userPreferences", userId],
      async () => {
        if (!userId) throw new Error("User ID is required")

        const { data, error } = await supabaseClient
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (error && error.code !== "PGRST116") throw error // PGRST116 is "no rows returned"

        return (
          data || {
            id: "",
            user_id: userId,
            fitness_level: "beginner",
            goals: [],
            preferred_workout_duration: 30,
            workout_days: ["monday", "wednesday", "friday"],
            focus_areas: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        )
      },
      {
        enabled: !!userId,
      },
    )
  }

  // Save user preferences
  const useSaveUserPreferences = () => {
    return useMutation<
      UserPreferences,
      Error,
      Omit<UserPreferences, "id" | "created_at" | "updated_at">
    >(
      async (preferences) => {
        // Check if preferences already exist
        const { data: existing } = await supabaseClient
          .from("user_preferences")
          .select("id")
          .eq("user_id", preferences.user_id)
          .single()

        if (existing) {
          // Update existing preferences
          const { data, error } = await supabaseClient
            .from("user_preferences")
            .update({
              ...preferences,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single()

          if (error) throw error
          return data
        } else {
          // Insert new preferences
          const { data, error } = await supabaseClient
            .from("user_preferences")
            .insert({
              ...preferences,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) throw error
          return data
        }
      },
      {
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries(["userPreferences", variables.user_id])
        },
      },
    )
  }

  return {
    useGetUserPreferences,
    useSaveUserPreferences,
  }
}

export const api = {
  // user: userService,
  // workout: workoutService,
  // exercise: exerciseService,
  aiCoach: aiCoachService,
  // social: socialService,
  // liveSession: liveSessionService,
  tracking: trackingService,
}

export default api
