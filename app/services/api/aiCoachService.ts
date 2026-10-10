import apiClient from "./client"
import { Platform } from "react-native"

// Types
export interface PostureAnalysisResult {
  score: number
  feedback: string[]
  correctPositions: Record<string, { x: number; y: number; z: number }>
  incorrectPositions: Record<string, { x: number; y: number; z: number }>
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  caloriesBurn: number
  exercises: Array<{
    id: string
    name: string
    sets: number
    reps: number
    duration: number
    restBetween: number
  }>
  schedule: Array<{
    day: string
    exercises: string[]
  }>
  createdAt: string
  updatedAt: string
}

export interface AICoachFeedback {
  id: string
  exerciseId: string
  userId: string
  feedback: string
  score: number
  timestamp: string
  videoUrl?: string
}

// AI Coach Service
export const aiCoachService = {
  // Analyze posture from image data
  analyzePosture: async (imageData: string, exerciseId: string): Promise<PostureAnalysisResult> => {
    const response = await apiClient.post("/ai-coach/analyze-posture", {
      imageData,
      exerciseId,
      platform: Platform.OS,
    })
    return response.data
  },

  // Generate workout plan based on user preferences
  generateWorkoutPlan: async (preferences: {
    goal: string
    level: string
    duration: number
    frequency: number
    focusAreas: string[]
    limitations: string[]
  }): Promise<WorkoutPlan> => {
    const response = await apiClient.post("/ai-coach/generate-workout-plan", preferences)
    return response.data
  },

  // Save workout plan
  saveWorkoutPlan: async (plan: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt">): Promise<WorkoutPlan> => {
    const response = await apiClient.post("/ai-coach/workout-plans", plan)
    return response.data
  },

  // Get workout plans
  getWorkoutPlans: async (): Promise<WorkoutPlan[]> => {
    const response = await apiClient.get("/ai-coach/workout-plans")
    return response.data
  },

  // Get workout plan by ID
  getWorkoutPlan: async (id: string): Promise<WorkoutPlan> => {
    const response = await apiClient.get(`/ai-coach/workout-plans/${id}`)
    return response.data
  },

  // Delete workout plan
  deleteWorkoutPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai-coach/workout-plans/${id}`)
  },

  // Save AI coach feedback
  saveFeedback: async (feedback: Omit<AICoachFeedback, "id" | "timestamp">): Promise<AICoachFeedback> => {
    const response = await apiClient.post("/ai-coach/feedback", feedback)
    return response.data
  },

  // Get AI coach feedback history
  getFeedbackHistory: async (exerciseId?: string): Promise<AICoachFeedback[]> => {
    const url = exerciseId ? `/ai-coach/feedback?exerciseId=${exerciseId}` : "/ai-coach/feedback"
    const response = await apiClient.get(url)
    return response.data
  },

  // Get AI coach feedback by ID
  getFeedback: async (id: string): Promise<AICoachFeedback> => {
    const response = await apiClient.get(`/ai-coach/feedback/${id}`)
    return response.data
  },
}
