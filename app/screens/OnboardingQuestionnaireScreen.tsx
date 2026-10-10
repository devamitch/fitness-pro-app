"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { useUserPreferencesStore } from "../stores/userPreferencesStore"
import { supabase } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native"

const { width } = Dimensions.get("window")

// Define question types
type FitnessLevel = "beginner" | "intermediate" | "advanced"
type FitnessGoal = "weight_loss" | "muscle_gain" | "flexibility" | "posture" | "general_fitness"
type WorkoutFrequency = "1-2" | "3-4" | "5+"
type WorkoutDuration = "15" | "30" | "45" | "60+"
type ProblemAreas = "neck" | "shoulders" | "back" | "hips" | "knees" | "ankles"

export const OnboardingQuestionnaireScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { setUserPreferences } = useUserPreferencesStore()

  // Current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // User answers
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null)
  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoal[]>([])
  const [workoutFrequency, setWorkoutFrequency] = useState<WorkoutFrequency | null>(null)
  const [workoutDuration, setWorkoutDuration] = useState<WorkoutDuration | null>(null)
  const [problemAreas, setProblemAreas] = useState<ProblemAreas[]>([])

  // Progress indicator
  const progress = useSharedValue(0.2)

  // Questions
  const questions = [
    {
      id: "fitness_level",
      question: "What's your fitness level?",
      options: [
        { value: "beginner", label: "Beginner" },
        { value: "intermediate", label: "Intermediate" },
        { value: "advanced", label: "Advanced" },
      ],
      type: "single",
      value: fitnessLevel,
      setValue: setFitnessLevel,
    },
    {
      id: "fitness_goals",
      question: "What are your fitness goals?",
      options: [
        { value: "weight_loss", label: "Weight Loss" },
        { value: "muscle_gain", label: "Muscle Gain" },
        { value: "flexibility", label: "Flexibility" },
        { value: "posture", label: "Improve Posture" },
        { value: "general_fitness", label: "General Fitness" },
      ],
      type: "multiple",
      value: fitnessGoals,
      setValue: setFitnessGoals,
    },
    {
      id: "workout_frequency",
      question: "How many times per week do you want to workout?",
      options: [
        { value: "1-2", label: "1-2 times" },
        { value: "3-4", label: "3-4 times" },
        { value: "5+", label: "5+ times" },
      ],
      type: "single",
      value: workoutFrequency,
      setValue: setWorkoutFrequency,
    },
    {
      id: "workout_duration",
      question: "How long do you want your workouts to be?",
      options: [
        { value: "15", label: "15 minutes" },
        { value: "30", label: "30 minutes" },
        { value: "45", label: "45 minutes" },
        { value: "60+", label: "60+ minutes" },
      ],
      type: "single",
      value: workoutDuration,
      setValue: setWorkoutDuration,
    },
    {
      id: "problem_areas",
      question: "Do you have any problem areas you want to focus on?",
      options: [
        { value: "neck", label: "Neck" },
        { value: "shoulders", label: "Shoulders" },
        { value: "back", label: "Back" },
        { value: "hips", label: "Hips" },
        { value: "knees", label: "Knees" },
        { value: "ankles", label: "Ankles" },
      ],
      type: "multiple",
      value: problemAreas,
      setValue: setProblemAreas,
    },
  ]

  // Update progress when question changes
  const updateProgress = (index: number) => {
    const newProgress = (index + 1) / questions.length
    progress.value = withTiming(newProgress, { duration: 300 })
  }

  // Handle next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      updateProgress(currentQuestionIndex + 1)
    } else {
      handleSubmit()
    }
  }

  // Handle previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      updateProgress(currentQuestionIndex - 1)
    }
  }

  // Handle option selection for single choice questions
  const handleSingleSelect = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    currentQuestion.setValue(value as any)
  }

  // Handle option selection for multiple choice questions
  const handleMultipleSelect = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    const currentValues = currentQuestion.value as string[]

    if (currentValues.includes(value)) {
      currentQuestion.setValue(currentValues.filter((v) => v !== value) as any)
    } else {
      currentQuestion.setValue([...currentValues, value] as any)
    }
  }

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (currentQuestion.type === "single") {
      return !!currentQuestion.value
    } else {
      return (currentQuestion.value as any[]).length > 0
    }
  }

  // Submit answers
  const handleSubmit = async () => {
    // Create user preferences object
    const userPreferences = {
      fitness_level: fitnessLevel,
      fitness_goals: fitnessGoals,
      workout_frequency: workoutFrequency,
      workout_duration: workoutDuration,
      problem_areas: problemAreas,
    }

    // Save to Zustand store
    setUserPreferences(userPreferences)

    // Save to Supabase if user is logged in
    if (user) {
      try {
        // Check if user preferences already exist
        const { data: existingPrefs } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (existingPrefs) {
          // Update existing preferences
          await supabase.from("user_preferences").update(userPreferences).eq("user_id", user.id)
        } else {
          // Insert new preferences
          await supabase.from("user_preferences").insert({
            user_id: user.id,
            ...userPreferences,
          })
        }
      } catch (error) {
        console.error("Error saving preferences:", error)
      }
    }

    // Navigate to exercise recommendations screen
    navigation.navigate("ExerciseRecommendations")
  }

  // Animated progress bar style
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    }
  })

  // Current question
  const currentQuestion = questions[currentQuestionIndex]

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={currentQuestionIndex === 0 ? () => navigation.goBack() : handlePrevious}
        >
          <ArrowLeft size={24} color="#0A84FF" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, progressBarStyle]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          key={currentQuestion.id}
          entering={FadeInRight}
          exiting={FadeOutLeft}
          style={styles.questionContainer}
        >
          <Text variant="header" style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isSelected =
                currentQuestion.type === "single"
                  ? currentQuestion.value === option.value
                  : (currentQuestion.value as string[]).includes(option.value)

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, isSelected && styles.selectedOption]}
                  onPress={() =>
                    currentQuestion.type === "single"
                      ? handleSingleSelect(option.value)
                      : handleMultipleSelect(option.value)
                  }
                >
                  <Text variant="subtitle" style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {option.label}
                  </Text>
                  {isSelected && <Check size={20} color="#FFFFFF" />}
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Next button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity
          style={[styles.nextButton, !isCurrentQuestionAnswered() && styles.disabledButton]}
          onPress={handleNext}
          disabled={!isCurrentQuestionAnswered()}
        >
          <Text variant="button" style={styles.nextButtonText}>
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0A84FF",
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  questionText: {
    marginBottom: 32,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedOption: {
    backgroundColor: "#0A84FF",
  },
  optionText: {
    color: "#000000",
  },
  selectedOptionText: {
    color: "#FFFFFF",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  nextButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 16,
  },
  nextButtonText: {
    color: "#FFFFFF",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#A2D2FF",
    opacity: 0.7,
  },
})
