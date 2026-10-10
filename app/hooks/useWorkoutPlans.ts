import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import type { WorkoutPlan } from "../stores/workoutPlansStore"

export const useWorkoutPlans = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Fetch all workout plans for the current user
  const plansQuery = useQuery({
    queryKey: ["workoutPlans", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as WorkoutPlan[]
    },
    enabled: !!user?.id,
  })

  // Add a new workout plan
  const addPlanMutation = useMutation({
    mutationFn: async (plan: Omit<WorkoutPlan, "id" | "created_at" | "updated_at">) => {
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
      return data as WorkoutPlan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutPlans", user?.id] })
    },
  })

  // Update an existing workout plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<WorkoutPlan, "id" | "user_id" | "created_at" | "updated_at">>
    }) => {
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
      return data as WorkoutPlan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutPlans", user?.id] })
    },
  })

  // Delete a workout plan
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_plans").delete().eq("id", id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutPlans", user?.id] })
    },
  })

  return {
    plans: plansQuery.data || [],
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    error: plansQuery.error,
    refetch: plansQuery.refetch,

    addPlan: addPlanMutation.mutate,
    isAddingPlan: addPlanMutation.isPending,

    updatePlan: updatePlanMutation.mutate,
    isUpdatingPlan: updatePlanMutation.isPending,

    deletePlan: deletePlanMutation.mutate,
    isDeletingPlan: deletePlanMutation.isPending,
  }
}
