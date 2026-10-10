"use client"

import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/authStore"
import { useEffect, useState } from "react"
import { useOfflineSupport } from "./useOfflineSupport"

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  duration?: number
  notes?: string
}

export interface Workout {
  id: string
  name: string
  date: string
  exercises: Exercise[]
  duration: number
  calories: number
  notes?: string
}

export function useWorkoutTracking() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()
  const { isOnline, saveOfflineOperation } = useOfflineSupport()

  // Fetch workouts when user changes
  useEffect(() => {
    if (user) {
      fetchWorkouts()
    } else {
      setWorkouts([])
    }
  }, [user])

  const fetchWorkouts = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (fetchError) throw fetchError

      setWorkouts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch workouts"))
      console.error("Error fetching workouts:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveWorkout = async (workout: Omit<Workout, "id">) => {
    if (!user) return null

    try {
      setIsLoading(true)
      setError(null)

      if (isOnline) {
        const { data, error: saveError } = await supabase
          .from("workouts")
          .insert([{ ...workout, user_id: user.id }])
          .select()

        if (saveError) throw saveError

        setWorkouts((prev) => [...(data || []), ...prev])
        return data?.[0] || null
      } else {
        // Save for offline sync
        const offlineWorkout = { ...workout, user_id: user.id, offline_id: Date.now().toString() }
        await saveOfflineOperation("insert_workout", offlineWorkout)

        // Optimistically update UI
        setWorkouts((prev) => [offlineWorkout as any, ...prev])
        return offlineWorkout
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to save workout"))
      console.error("Error saving workout:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateWorkout = async (id: string, updates: Partial<Workout>) => {
    if (!user) return false

    try {
      setIsLoading(true)
      setError(null)

      if (isOnline) {
        const { error: updateError } = await supabase
          .from("workouts")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id)

        if (updateError) throw updateError

        setWorkouts((prev) =>
          prev.map((workout) => (workout.id === id ? { ...workout, ...updates } : workout)),
        )
        return true
      } else {
        // Save for offline sync
        await saveOfflineOperation("update_workout", { id, updates, user_id: user.id })

        // Optimistically update UI
        setWorkouts((prev) =>
          prev.map((workout) => (workout.id === id ? { ...workout, ...updates } : workout)),
        )
        return true
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update workout"))
      console.error("Error updating workout:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteWorkout = async (id: string) => {
    if (!user) return false

    try {
      setIsLoading(true)
      setError(null)

      if (isOnline) {
        const { error: deleteError } = await supabase
          .from("workouts")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)

        if (deleteError) throw deleteError

        setWorkouts((prev) => prev.filter((workout) => workout.id !== id))
        return true
      } else {
        // Save for offline sync
        await saveOfflineOperation("delete_workout", { id, user_id: user.id })

        // Optimistically update UI
        setWorkouts((prev) => prev.filter((workout) => workout.id !== id))
        return true
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete workout"))
      console.error("Error deleting workout:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    workouts,
    isLoading,
    error,
    fetchWorkouts,
    saveWorkout,
    updateWorkout,
    deleteWorkout,
  }
}
