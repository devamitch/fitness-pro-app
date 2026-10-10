"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Animated, { FadeInUp } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { useUserPreferencesStore } from "../stores/userPreferencesStore"
import { generateExerciseRecommendations } from "../services/openai"
import { supabase } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import { ArrowLeft, Check } from "lucide-react-native"
import { MMKV } from "react-native-mmkv"

export const ExerciseRecommendationsScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { preferences, setRecommendedExercises, setRecommendedWorkouts } = useUserPreferencesStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openAIKey, setOpenAIKey] = useState<string | null>(null)

  const storage = new MMKV()

  // Fetch OpenAI API key from environment variables or storage
  useEffect(() => {
    const getOpenAIKey = async () => {
      // Try to get from environment variables first
      const envKey = process.env.OPENAI_API_KEY
      if (envKey) {
        setOpenAIKey(envKey)
        return
      }

      // Otherwise try to get from storage
      const storedKey = storage.getString("openai-api-key")
      if (storedKey) {
        setOpenAIKey(storedKey)
        return
      }

      // If no key is found, show error
      setError("OpenAI API key not found. Please add it in settings.")
      setLoading(false)
    }

    getOpenAIKey()
  }, [])

  // Generate recommendations when preferences and API key are available
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!preferences || !openAIKey) return

      try {
        setLoading(true)

        // Generate recommendations using OpenAI
        const { exercises, workouts } = await generateExerciseRecommendations(preferences, openAIKey)

        // Save to Zustand store
        setRecommendedExercises(exercises)
        setRecommendedWorkouts(workouts)

        // Save to Supabase if user is logged in
        if (user) {
          try {
            // Save exercises
            for (const exercise of exercises) {
              await supabase.from("exercises").upsert(
                {
                  name: exercise.name,
                  description: exercise.description,
                  difficulty: exercise.difficulty,
                  category_id: "00000000-0000-0000-0000-000000000000", // Default category
                  video_url: "https://example.com/placeholder.mp4", // Placeholder
                  thumbnail_url: "https://example.com/placeholder.jpg", // Placeholder
                  duration: exercise.duration || 60,
                  calories: exercise.calories || 10,
                  instructions: exercise.posture_points || [],
                  target_poses: [], // Will be populated later
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "name" },
              )
            }

            // Save workouts
            for (const workout of workouts) {
              const { data: workoutData, error: workoutError } = await supabase.from("workouts").upsert(
                {
                  name: workout.name,
                  description: workout.description,
                  difficulty: workout.difficulty,
                  image_url: "https://example.com/placeholder.jpg", // Placeholder
                  duration: workout.duration || 30,
                  calories: workout.calories || 100,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "name", returning: true },
              )

              if (workoutError) throw workoutError

              // Add exercises to workout
              if (workoutData && workoutData[0]) {
                const workoutId = workoutData[0].id

                for (let i = 0; i < workout.exercises.length; i++) {
                  const exerciseName = workout.exercises[i].name

                  // Find exercise ID
                  const { data: exerciseData } = await supabase
                    .from("exercises")
                    .select("id")
                    .eq("name", exerciseName)
                    .single()

                  if (exerciseData) {
                    await supabase.from("workout_exercises").insert({
                      workout_id: workoutId,
                      exercise_id: exerciseData.id,
                      order_index: i,
                    })
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error saving to Supabase:", error)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error generating recommendations:", error)
        setError("Failed to generate recommendations. Please try again.")
        setLoading(false)
      }
    }

    generateRecommendations()
  }, [preferences, openAIKey, user])

  // Handle API key input
  const promptForAPIKey = () => {
    Alert.prompt(
      "OpenAI API Key",
      "Please enter your OpenAI API key:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: (key) => {
            if (key) {
              storage.set("openai-api-key", key)
              setOpenAIKey(key)
              setError(null)
            }
          },
        },
      ],
      "secure-text",
    )
  }

  // Continue to home screen
  const handleContinue = () => {
    navigation.navigate("Main")
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text variant="title">Your Recommendations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text variant="body" style={styles.loadingText}>
              Generating personalized recommendations...
            </Text>
            <Text variant="caption" style={styles.loadingSubtext}>
              This may take a minute
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text variant="body" style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={promptForAPIKey}>
              <Text variant="button" style={styles.retryButtonText}>
                Add API Key
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.successCard}>
              <View style={styles.checkCircle}>
                <Check size={32} color="#FFFFFF" />
              </View>
              <Text variant="title" style={styles.successTitle}>
                Your Plan is Ready!
              </Text>
              <Text variant="body" style={styles.successText}>
                We've created a personalized workout plan based on your preferences. Focus on proper posture and form
                for best results.
              </Text>
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text variant="button" style={styles.continueButtonText}>
                  Continue to Workouts
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.tipsCard}>
              <Text variant="subtitle" style={styles.tipsTitle}>
                Tips for Success
              </Text>
              <View style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text variant="subtitle" style={styles.tipNumberText}>
                    1
                  </Text>
                </View>
                <Text variant="body" style={styles.tipText}>
                  Focus on proper form and posture during each exercise
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text variant="subtitle" style={styles.tipNumberText}>
                    2
                  </Text>
                </View>
                <Text variant="body" style={styles.tipText}>
                  Start with shorter workouts and gradually increase duration
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text variant="subtitle" style={styles.tipNumberText}>
                    3
                  </Text>
                </View>
                <Text variant="body" style={styles.tipText}>
                  Use the camera feature to check your posture during exercises
                </Text>
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    textAlign: "center",
    color: "#8E8E93",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
    color: "#FF3B30",
  },
  retryButton: {
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
  },
  successContainer: {
    flex: 1,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#32D74B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    textAlign: "center",
    marginBottom: 24,
    color: "#8E8E93",
  },
  continueButton: {
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
  },
  tipsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipNumberText: {
    color: "#0A84FF",
  },
  tipText: {
    flex: 1,
  },
})
