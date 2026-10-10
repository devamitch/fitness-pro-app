import apiClient from "./client"
import { Platform } from "react-native"

// Types
export interface ActivityData {
  type: "walking" | "running" | "cycling" | "swimming" | "workout" | "other"
  startTime: string
  endTime: string
  duration: number // in seconds
  distance?: number // in meters
  steps?: number
  caloriesBurned: number
  heartRate?: {
    avg: number
    max: number
    min: number
    readings: Array<{
      timestamp: string
      value: number
    }>
  }
  location?: {
    coordinates: Array<{
      latitude: number
      longitude: number
      altitude?: number
      timestamp: string
    }>
  }
  workoutId?: string
  exerciseId?: string
}

export interface UserStats {
  totalWorkouts: number
  totalExercises: number
  totalDuration: number // in seconds
  totalCaloriesBurned: number
  totalDistance: number // in meters
  totalSteps: number
  streakDays: number
  lastActivity: string // ISO date string
  weeklyProgress: Array<{
    date: string
    workouts: number
    duration: number
    caloriesBurned: number
  }>
  monthlyProgress: Array<{
    month: string
    workouts: number
    duration: number
    caloriesBurned: number
  }>
}

// Tracking Service
export const trackingService = {
  // Track activity
  trackActivity: async (activity: ActivityData): Promise<{ id: string }> => {
    const response = await apiClient.post("/tracking/activities", {
      ...activity,
      platform: Platform.OS,
      deviceInfo: {
        model: Platform.OS === "ios" ? "iPhone" : "Android",
        os: Platform.OS,
        version: Platform.Version,
      },
    })
    return response.data
  },

  // Get user activities
  getUserActivities: async (
    options: {
      limit?: number
      offset?: number
      startDate?: string
      endDate?: string
      type?: ActivityData["type"]
    } = {},
  ): Promise<{
    activities: Array<ActivityData & { id: string }>
    total: number
  }> => {
    const response = await apiClient.get("/tracking/activities", {
      params: options,
    })
    return response.data
  },

  // Get user stats
  getUserStats: async (
    options: {
      startDate?: string
      endDate?: string
    } = {},
  ): Promise<UserStats> => {
    const response = await apiClient.get("/tracking/stats", {
      params: options,
    })
    return response.data
  },

  // Get activity by ID
  getActivity: async (id: string): Promise<ActivityData & { id: string }> => {
    const response = await apiClient.get(`/tracking/activities/${id}`)
    return response.data
  },

  // Delete activity
  deleteActivity: async (id: string): Promise<void> => {
    await apiClient.delete(`/tracking/activities/${id}`)
  },

  // Update activity
  updateActivity: async (id: string, updates: Partial<ActivityData>): Promise<ActivityData & { id: string }> => {
    const response = await apiClient.put(`/tracking/activities/${id}`, updates)
    return response.data
  },

  // Sync activities with health services
  syncWithHealthServices: async (
    service: "apple_health" | "google_fit" | "samsung_health" | "fitbit" | "garmin",
  ): Promise<{
    synced: number
    activities: Array<ActivityData & { id: string }>
  }> => {
    const response = await apiClient.post("/tracking/sync", { service })
    return response.data
  },

  // Get activity summary
  getActivitySummary: async (options: {
    period: "day" | "week" | "month" | "year"
    date?: string // ISO date string
  }): Promise<{
    totalDuration: number
    totalCaloriesBurned: number
    totalDistance: number
    totalSteps: number
    activities: {
      [key in ActivityData["type"]]?: {
        count: number
        duration: number
        caloriesBurned: number
      }
    }
  }> => {
    const response = await apiClient.get("/tracking/summary", {
      params: options,
    })
    return response.data
  },
}
