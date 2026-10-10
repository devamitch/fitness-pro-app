import supabase from "@/services/supabase"
import { storage } from "@/utils/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export interface WorkoutPlan {
  id: string
  user_id: string
  name: string
  description: string
  content: string
  created_at: string
  updated_at: string
  is_ai_generated: boolean
  metadata?: {
    fitness_level?: string
    focus_areas?: string[]
    duration?: number
    frequency?: number
    equipment?: string[]
  }
}

interface WorkoutPlansState {
  plans: WorkoutPlan[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchPlans: (userId: string) => Promise<void>
  addPlan: (
    plan: Omit<WorkoutPlan, "id" | "created_at" | "updated_at">,
  ) => Promise<WorkoutPlan | null>
  updatePlan: (
    id: string,
    updates: Partial<Omit<WorkoutPlan, "id" | "user_id" | "created_at" | "updated_at">>,
  ) => Promise<WorkoutPlan | null>
  deletePlan: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useWorkoutPlansStore = create<WorkoutPlansState>()(
  persist(
    immer((set, get) => ({
      plans: [],
      isLoading: false,
      error: null,

      fetchPlans: async (userId: string) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const { data, error } = await supabase
            .from("workout_plans")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

          if (error) throw error

          set((state) => {
            state.plans = data
            state.isLoading = false
          })
        } catch (error) {
          console.error("Error fetching workout plans:", error)
          set((state) => {
            state.error = error instanceof Error ? error.message : "Failed to fetch workout plans"
            state.isLoading = false
          })
        }
      },

      addPlan: async (plan) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const { data, error } = await supabase
            .from("workout_plans")
            .insert({
              ...plan,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) throw error

          set((state) => {
            state.plans = [data, ...state.plans]
            state.isLoading = false
          })

          return data
        } catch (error) {
          console.error("Error adding workout plan:", error)
          set((state) => {
            state.error = error instanceof Error ? error.message : "Failed to add workout plan"
            state.isLoading = false
          })
          return null
        }
      },

      updatePlan: async (id, updates) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const { data, error } = await supabase
            .from("workout_plans")
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single()

          if (error) throw error

          set((state) => {
            state.plans = state.plans.map((plan) => (plan.id === id ? data : plan))
            state.isLoading = false
          })

          return data
        } catch (error) {
          console.error("Error updating workout plan:", error)
          set((state) => {
            state.error = error instanceof Error ? error.message : "Failed to update workout plan"
            state.isLoading = false
          })
          return null
        }
      },

      deletePlan: async (id) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const { error } = await supabase.from("workout_plans").delete().eq("id", id)

          if (error) throw error

          set((state) => {
            state.plans = state.plans.filter((plan) => plan.id !== id)
            state.isLoading = false
          })

          return true
        } catch (error) {
          console.error("Error deleting workout plan:", error)
          set((state) => {
            state.error = error instanceof Error ? error.message : "Failed to delete workout plan"
            state.isLoading = false
          })
          return false
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null
        })
      },
    })),
    {
      name: "workout-plans-storage",
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
        plans: state.plans,
      }),
    },
  ),
)
