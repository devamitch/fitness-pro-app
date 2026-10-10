import { storage } from "@/utils/storage"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { mediaPipe, type PoseData } from "./mediaPipe"
import { openai } from "./openai"
import { supabase } from "./supabase"
import { tts } from "./tts"

// Define types for exercise feedback
export interface ExerciseFeedback {
  score: number
  feedback: string
  tips: string[]
  isGoodForm: boolean
}

// Define types for workout plan
export interface WorkoutPlan {
  id: string
  name: string
  description: string
  durationWeeks: number
  level: string
  goal: string
  workouts: Workout[]
  createdAt: number
  updatedAt: number
}

export interface Workout {
  day: number
  name: string
  exercises: WorkoutExercise[]
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: number
  rest: number
  notes?: string
}

// Define types for exercise session
export interface ExerciseSession {
  id: string
  exerciseId: string
  exerciseName: string
  startTime: number
  endTime: number | null
  duration: number
  reps: number
  sets: number
  caloriesBurned: number
  averageAccuracy: number
  feedback: string[]
}

// Define AI coach state
interface AICoachState {
  isInitialized: boolean
  isProcessing: boolean
  currentExercise: string | null
  currentExerciseId: string | null
  isMonitoring: boolean
  lastPose: PoseData | null
  repCount: number
  setCount: number
  exerciseSessions: ExerciseSession[]
  workoutPlans: WorkoutPlan[]

  // Methods
  initialize: () => Promise<boolean>
  startExerciseMonitoring: (exerciseId: string, exerciseName: string) => Promise<boolean>
  stopExerciseMonitoring: () => Promise<boolean>
  processFrame: (pose: PoseData) => Promise<void>
  getExerciseFeedback: (exerciseId: string, pose: PoseData) => Promise<ExerciseFeedback>
  generateWorkoutPlan: (preferences: WorkoutPreferences) => Promise<WorkoutPlan>
  saveWorkoutPlan: (plan: WorkoutPlan) => Promise<void>
  deleteWorkoutPlan: (planId: string) => Promise<void>
  getWorkoutPlans: () => WorkoutPlan[]
  getExerciseSessions: () => ExerciseSession[]
  saveExerciseSession: (session: ExerciseSession) => Promise<void>
  deleteExerciseSession: (sessionId: string) => Promise<void>
  resetRepCount: () => void
  incrementRepCount: () => void
  incrementSetCount: () => void
  resetSetCount: () => void
}

// Define workout preferences
export interface WorkoutPreferences {
  fitnessLevel: string
  goals: string[]
  daysPerWeek: number
  equipment: string[]
  focusAreas: string[]
  timePerWorkout: number
  healthConditions?: string[]
}

// Create AI coach store
export const useAICoachStore = create<AICoachState>()(
  immer((set, get) => ({
    isInitialized: false,
    isProcessing: false,
    currentExercise: null,
    currentExerciseId: null,
    isMonitoring: false,
    lastPose: null,
    repCount: 0,
    setCount: 0,
    exerciseSessions: [],
    workoutPlans: [],

    initialize: async () => {
      try {
        if (get().isInitialized) {
          return true
        }

        // Initialize MediaPipe
        const mediaPipeInitialized = await mediaPipe.initialize()

        // Initialize TTS
        const ttsInitialized = await tts.initialize()

        // Load cached data
        const loadExerciseSessions = async () => {
          const sessionsStr = storage.getString("exercise_sessions")
          if (sessionsStr) {
            try {
              const sessions = JSON.parse(sessionsStr)
              set((state) => {
                state.exerciseSessions = sessions
              })
            } catch (error) {
              console.error("Error parsing exercise sessions:", error)
            }
          }
        }

        const loadWorkoutPlans = async () => {
          const plansStr = storage.getString("workout_plans")
          if (plansStr) {
            try {
              const plans = JSON.parse(plansStr)
              set((state) => {
                state.workoutPlans = plans
              })
            } catch (error) {
              console.error("Error parsing workout plans:", error)
            }
          }
        }

        await Promise.all([loadExerciseSessions(), loadWorkoutPlans()])

        set((state) => {
          state.isInitialized = mediaPipeInitialized && ttsInitialized
        })

        return get().isInitialized
      } catch (error) {
        console.error("Error initializing AI Coach:", error)
        return false
      }
    },

    startExerciseMonitoring: async (exerciseId, exerciseName) => {
      try {
        if (!get().isInitialized) {
          await get().initialize()
        }

        // Start pose detection
        const started = await mediaPipe.startPoseDetection({
          minPoseScore: 0.6,
          minKeypointScore: 0.5,
          smoothing: true,
        })

        if (started) {
          // Create new exercise session
          const sessionId = `session_${Date.now()}`
          const newSession: ExerciseSession = {
            id: sessionId,
            exerciseId,
            exerciseName,
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            reps: 0,
            sets: 0,
            caloriesBurned: 0,
            averageAccuracy: 0,
            feedback: [],
          }

          set((state) => {
            state.currentExercise = exerciseName
            state.currentExerciseId = exerciseId
            state.isMonitoring = true
            state.repCount = 0
            state.setCount = 0
            state.exerciseSessions.push(newSession)
          })

          // Provide audio feedback
          tts.speak(`Starting ${exerciseName} monitoring. Get ready.`)

          return true
        }

        return false
      } catch (error) {
        console.error("Error starting exercise monitoring:", error)
        return false
      }
    },

    stopExerciseMonitoring: async () => {
      try {
        // Stop pose detection
        await mediaPipe.stopPoseDetection()

        // Update current session
        const sessions = [...get().exerciseSessions]
        const currentSessionIndex = sessions.findIndex(
          (s) => s.exerciseId === get().currentExerciseId && s.endTime === null,
        )

        if (currentSessionIndex >= 0) {
          const endTime = Date.now()
          const session = sessions[currentSessionIndex]

          session.endTime = endTime
          session.duration = Math.round((endTime - session.startTime) / 1000) // in seconds
          session.reps = get().repCount
          session.sets = get().setCount

          // Save updated sessions
          set((state) => {
            state.exerciseSessions = sessions
            state.currentExercise = null
            state.currentExerciseId = null
            state.isMonitoring = false
          })

          // Save to storage
          storage.set("exercise_sessions", JSON.stringify(sessions))

          // Save to Supabase if user is logged in
          try {
            const user = supabase.auth.currentUser
            if (user) {
              await supabase.from("exercise_sessions").insert({
                user_id: user.id,
                exercise_id: session.exerciseId,
                exercise_name: session.exerciseName,
                start_time: new Date(session.startTime).toISOString(),
                end_time: new Date(session.endTime).toISOString(),
                duration: session.duration,
                reps: session.reps,
                sets: session.sets,
                calories_burned: session.caloriesBurned,
                average_accuracy: session.averageAccuracy,
                feedback: session.feedback,
              })
            }
          } catch (error) {
            console.error("Error saving session to Supabase:", error)
          }
        }

        return true
      } catch (error) {
        console.error("Error stopping exercise monitoring:", error)
        return false
      }
    },

    processFrame: async (pose) => {
      if (!get().isMonitoring || get().isProcessing) {
        return
      }

      set((state) => {
        state.isProcessing = true
        state.lastPose = pose
      })

      try {
        const exerciseId = get().currentExerciseId
        const previousPoses = [] // In a real app, we would maintain a history of poses

        if (exerciseId) {
          // Get exercise type
          const exerciseType = get().currentExercise?.toLowerCase() || "default"

          // Detect repetition
          const { isRepCompleted, repQuality } = mediaPipe.detectRepetition(
            pose,
            previousPoses,
            exerciseType,
          )

          if (isRepCompleted) {
            // Increment rep count
            get().incrementRepCount()

            // Get feedback
            const feedback = await get().getExerciseFeedback(exerciseId, pose)

            // Update session with feedback
            const sessions = [...get().exerciseSessions]
            const currentSessionIndex = sessions.findIndex(
              (s) => s.exerciseId === exerciseId && s.endTime === null,
            )

            if (currentSessionIndex >= 0) {
              if (feedback.feedback) {
                sessions[currentSessionIndex].feedback.push(feedback.feedback)
              }

              // Update average accuracy
              const currentAccuracy = sessions[currentSessionIndex].averageAccuracy
              const currentReps = get().repCount

              if (currentReps > 1) {
                sessions[currentSessionIndex].averageAccuracy =
                  (currentAccuracy * (currentReps - 1) + feedback.score) / currentReps
              } else {
                sessions[currentSessionIndex].averageAccuracy = feedback.score
              }

              set((state) => {
                state.exerciseSessions = sessions
              })
            }

            // Provide audio feedback based on rep quality
            if (repQuality > 80) {
              tts.speak(`Rep ${get().repCount}. Excellent form!`)
            } else if (repQuality > 60) {
              tts.speak(`Rep ${get().repCount}. Good form.`)
            } else {
              tts.speak(`Rep ${get().repCount}. ${feedback.feedback}`)
            }
          }
        }
      } catch (error) {
        console.error("Error processing frame:", error)
      } finally {
        set((state) => {
          state.isProcessing = false
        })
      }
    },

    getExerciseFeedback: async (exerciseId, pose) => {
      try {
        // Compare with reference form
        const comparison = mediaPipe.comparePoseWithForm(pose, exerciseId)

        // If we have a good comparison, use it
        if (comparison.score > 0) {
          return {
            score: comparison.score,
            feedback: comparison.feedback.length > 0 ? comparison.feedback[0] : "Good form!",
            tips: comparison.feedback,
            isGoodForm: comparison.score >= 70,
          }
        }

        // Fallback to OpenAI for analysis
        const feedback = await openai.generateFormFeedback(
          get().currentExercise || "exercise",
          pose,
          "intermediate", // User level
        )

        return {
          score: feedback.score,
          feedback: feedback.feedback,
          tips: feedback.tips,
          isGoodForm: feedback.score >= 70,
        }
      } catch (error) {
        console.error("Error getting exercise feedback:", error)

        // Return default feedback on error
        return {
          score: 0,
          feedback: "I couldn't analyze your form. Please try again.",
          tips: [
            "Make sure you're visible in the frame",
            "Try a different angle",
            "Ensure good lighting",
          ],
          isGoodForm: false,
        }
      }
    },

    generateWorkoutPlan: async (preferences) => {
      try {
        // Generate plan with OpenAI
        const plan = await openai.generateWorkoutPlan(preferences)

        // Add metadata
        const planWithMetadata: WorkoutPlan = {
          ...plan,
          id: `plan_${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        // Save plan
        await get().saveWorkoutPlan(planWithMetadata)

        return planWithMetadata
      } catch (error) {
        console.error("Error generating workout plan:", error)
        throw error
      }
    },

    saveWorkoutPlan: async (plan) => {
      try {
        const plans = [...get().workoutPlans]
        const existingIndex = plans.findIndex((p) => p.id === plan.id)

        if (existingIndex >= 0) {
          plans[existingIndex] = {
            ...plan,
            updatedAt: Date.now(),
          }
        } else {
          plans.push(plan)
        }

        set((state) => {
          state.workoutPlans = plans
        })

        // Save to storage
        storage.set("workout_plans", JSON.stringify(plans))

        // Save to Supabase if user is logged in
        try {
          const user = supabase.auth.currentUser
          if (user) {
            await supabase.from("workout_plans").upsert({
              id: plan.id,
              user_id: user.id,
              name: plan.name,
              description: plan.description,
              duration_weeks: plan.durationWeeks,
              level: plan.level,
              goal: plan.goal,
              workouts: plan.workouts,
              created_at: new Date(plan.createdAt).toISOString(),
              updated_at: new Date(plan.updatedAt).toISOString(),
            })
          }
        } catch (error) {
          console.error("Error saving plan to Supabase:", error)
        }
      } catch (error) {
        console.error("Error saving workout plan:", error)
      }
    },

    deleteWorkoutPlan: async (planId) => {
      try {
        const plans = get().workoutPlans.filter((p) => p.id !== planId)

        set((state) => {
          state.workoutPlans = plans
        })

        // Save to storage
        storage.set("workout_plans", JSON.stringify(plans))

        // Delete from Supabase if user is logged in
        try {
          const user = supabase.auth.currentUser
          if (user) {
            await supabase.from("workout_plans").delete().eq("id", planId)
          }
        } catch (error) {
          console.error("Error deleting plan from Supabase:", error)
        }
      } catch (error) {
        console.error("Error deleting workout plan:", error)
      }
    },

    getWorkoutPlans: () => {
      return get().workoutPlans
    },

    getExerciseSessions: () => {
      return get().exerciseSessions
    },

    saveExerciseSession: async (session) => {
      try {
        const sessions = [...get().exerciseSessions]
        const existingIndex = sessions.findIndex((s) => s.id === session.id)

        if (existingIndex >= 0) {
          sessions[existingIndex] = session
        } else {
          sessions.push(session)
        }

        set((state) => {
          state.exerciseSessions = sessions
        })

        // Save to storage
        storage.set("exercise_sessions", JSON.stringify(sessions))

        // Save to Supabase if user is logged in
        try {
          const user = supabase.auth.currentUser
          if (user) {
            await supabase.from("exercise_sessions").upsert({
              id: session.id,
              user_id: user.id,
              exercise_id: session.exerciseId,
              exercise_name: session.exerciseName,
              start_time: new Date(session.startTime).toISOString(),
              end_time: session.endTime ? new Date(session.endTime).toISOString() : null,
              duration: session.duration,
              reps: session.reps,
              sets: session.sets,
              calories_burned: session.caloriesBurned,
              average_accuracy: session.averageAccuracy,
              feedback: session.feedback,
            })
          }
        } catch (error) {
          console.error("Error saving session to Supabase:", error)
        }
      } catch (error) {
        console.error("Error saving exercise session:", error)
      }
    },

    deleteExerciseSession: async (sessionId) => {
      try {
        const sessions = get().exerciseSessions.filter((s) => s.id !== sessionId)

        set((state) => {
          state.exerciseSessions = sessions
        })

        // Save to storage
        storage.set("exercise_sessions", JSON.stringify(sessions))

        // Delete from Supabase if user is logged in
        try {
          const user = supabase.auth.currentUser
          if (user) {
            await supabase.from("exercise_sessions").delete().eq("id", sessionId)
          }
        } catch (error) {
          console.error("Error deleting session from Supabase:", error)
        }
      } catch (error) {
        console.error("Error deleting exercise session:", error)
      }
    },

    resetRepCount: () => {
      set((state) => {
        state.repCount = 0
      })
    },

    incrementRepCount: () => {
      set((state) => {
        state.repCount += 1
      })
    },

    incrementSetCount: () => {
      set((state) => {
        state.setCount += 1
        state.repCount = 0 // Reset rep count when incrementing set
      })
    },

    resetSetCount: () => {
      set((state) => {
        state.setCount = 0
        state.repCount = 0
      })
    },
  })),
)

// Create a simplified API for common operations
export const aiCoach = {
  // Initialize AI coach
  initialize: async (): Promise<boolean> => {
    return await useAICoachStore.getState().initialize()
  },

  // Start exercise monitoring
  startExerciseMonitoring: async (exerciseId: string, exerciseName: string): Promise<boolean> => {
    return await useAICoachStore.getState().startExerciseMonitoring(exerciseId, exerciseName)
  },

  // Stop exercise monitoring
  stopExerciseMonitoring: async (): Promise<boolean> => {
    return await useAICoachStore.getState().stopExerciseMonitoring()
  },

  // Process a pose frame
  processFrame: async (pose: PoseData): Promise<void> => {
    return await useAICoachStore.getState().processFrame(pose)
  },

  // Get exercise feedback
  getExerciseFeedback: async (exerciseId: string, pose: PoseData): Promise<ExerciseFeedback> => {
    return await useAICoachStore.getState().getExerciseFeedback(exerciseId, pose)
  },

  // Generate workout plan
  generateWorkoutPlan: async (preferences: WorkoutPreferences): Promise<WorkoutPlan> => {
    return await useAICoachStore.getState().generateWorkoutPlan(preferences)
  },

  // Get all workout plans
  getWorkoutPlans: (): WorkoutPlan[] => {
    return useAICoachStore.getState().getWorkoutPlans()
  },

  // Get all exercise sessions
  getExerciseSessions: (): ExerciseSession[] => {
    return useAICoachStore.getState().getExerciseSessions()
  },

  // Get current rep count
  getRepCount: (): number => {
    return useAICoachStore.getState().repCount
  },

  // Get current set count
  getSetCount: (): number => {
    return useAICoachStore.getState().setCount
  },

  // Check if monitoring is active
  isMonitoring: (): boolean => {
    return useAICoachStore.getState().isMonitoring
  },

  // Get current exercise
  getCurrentExercise: (): string | null => {
    return useAICoachStore.getState().currentExercise
  },

  // Increment rep count
  incrementRepCount: (): void => {
    useAICoachStore.getState().incrementRepCount()
  },

  // Increment set count
  incrementSetCount: (): void => {
    useAICoachStore.getState().incrementSetCount()
  },
}
