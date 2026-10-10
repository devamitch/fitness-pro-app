"use client"

import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/authStore"
import { storage } from "@/utils/storage"
import { useEffect, useState } from "react"

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  units: "metric" | "imperial"
  notifications: boolean
  workoutReminders: boolean
  soundEffects: boolean
  hapticFeedback: boolean
  voiceGuidance: boolean
  privacySettings: {
    shareWorkouts: boolean
    shareProgress: boolean
    allowDataCollection: boolean
  }
  fitnessGoals: {
    weeklyWorkouts: number
    dailySteps: number
    weightGoal?: number
  }
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  units: "metric",
  notifications: true,
  workoutReminders: true,
  soundEffects: true,
  hapticFeedback: true,
  voiceGuidance: false,
  privacySettings: {
    shareWorkouts: false,
    shareProgress: false,
    allowDataCollection: true,
  },
  fitnessGoals: {
    weeklyWorkouts: 3,
    dailySteps: 10000,
  },
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      loadPreferences()
    } else {
      // Load from local storage for non-authenticated users
      const localPrefs = storage.getString("userPreferences")
      if (localPrefs) {
        try {
          setPreferences(JSON.parse(localPrefs))
        } catch (e) {
          console.error("Error parsing local preferences:", e)
        }
      }
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // First check local cache
      const cachedPrefs = storage.getString(`userPreferences:${user.id}`)
      if (cachedPrefs) {
        try {
          setPreferences(JSON.parse(cachedPrefs))
        } catch (e) {
          console.error("Error parsing cached preferences:", e)
        }
      }

      // Then fetch from server
      const { data, error: fetchError } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw fetchError
      }

      if (data?.preferences) {
        const serverPrefs = data.preferences as UserPreferences
        setPreferences(serverPrefs)

        // Update cache
        storage.set(`userPreferences:${user.id}`, JSON.stringify(serverPrefs))
      } else if (!cachedPrefs) {
        // If no preferences found, create default ones
        await savePreferences(DEFAULT_PREFERENCES)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load preferences"))
      console.error("Error loading preferences:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      setIsLoading(true)
      setError(null)

      // Update local state immediately for responsive UI
      setPreferences(newPreferences)

      // Save to local storage for all users
      storage.set("userPreferences", JSON.stringify(newPreferences))

      if (user) {
        // Save to cache
        storage.set(`userPreferences:${user.id}`, JSON.stringify(newPreferences))

        // Save to server
        const { error: upsertError } = await supabase.from("user_preferences").upsert({
          user_id: user.id,
          preferences: newPreferences,
          updated_at: new Date().toISOString(),
        })

        if (upsertError) throw upsertError
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to save preferences"))
      console.error("Error saving preferences:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const updatedPreferences = {
      ...preferences,
      ...updates,
      // Handle nested objects
      privacySettings: {
        ...preferences.privacySettings,
        ...(updates.privacySettings || {}),
      },
      fitnessGoals: {
        ...preferences.fitnessGoals,
        ...(updates.fitnessGoals || {}),
      },
    }

    return savePreferences(updatedPreferences)
  }

  return {
    preferences,
    isLoading,
    error,
    loadPreferences,
    savePreferences,
    updatePreferences,
  }
}
