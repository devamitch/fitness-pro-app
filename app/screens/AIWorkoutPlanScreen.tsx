"use client"

import { Calendar } from "@/components/ui/calendar"

import type React from "react"
import { useState, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Text } from "../components/Text"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { AnimatedButton } from "../components/AnimatedButton"
import { useTheme } from "../theme/theme"
import { useAuthStore } from "../stores/authStore"
import { useAICoachStore } from "../stores/aiCoachStore"
import { supabaseHelper } from "../services/supabase"
import { ArrowLeft, Brain, Dumbbell, Clock, Target, ChevronRight, Check, Loader2, Save } from "lucide-react-native"

interface WorkoutPlan {
  id: string
  name: string
  description: string
  duration: number
  difficulty: string
  goal: string
  workouts: {
    id: string
    name: string
    description: string
    exercises: {
      id: string
      name: string
      sets: number
      reps: number
      duration: number
    }[]
  }[]
}

export const AIWorkoutPlanScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const { generateWorkoutPlan } = useAICoachStore()

  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState<string>("")
  const [fitnessLevel, setFitnessLevel] = useState<string>("")
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3)
  const [duration, setDuration] = useState<number>(30)
  const [equipment, setEquipment] = useState<string[]>([])
  const [preferences, setPreferences] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  const scrollViewRef = useRef<ScrollView>(null)

  // Available goals
  const goals = ["Weight Loss", "Muscle Gain", "Strength", "Endurance", "Flexibility", "General Fitness"]

  // Available fitness levels
  const fitnessLevels = ["Beginner", "Intermediate", "Advanced"]

  // Available equipment
  const availableEquipment = [
    "None (Bodyweight)",
    "Dumbbells",
    "Resistance Bands",
    "Kettlebells",
    "Barbell",
    "Pull-up Bar",
    "Gym Machines",
  ]

  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && !goal) {
      Alert.alert("Please select a goal")
      return
    }

    if (step === 2 && !fitnessLevel) {
      Alert.alert("Please select your fitness level")
      return
    }

    setStep(step + 1)
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }, 100)
  }

  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1)
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }, 100)
  }

  // Handle equipment toggle
  const handleEquipmentToggle = (item: string) => {
    if (equipment.includes(item)) {
      setEquipment(equipment.filter((eq) => eq !== item))
    } else {
      setEquipment([...equipment, item])
    }
  }

  // Handle generate plan
  const handleGeneratePlan = async () => {
    if (!user) {
      Alert.alert("Please sign in to generate a workout plan")
      return
    }

    setIsGenerating(true)

    try {
      // Prepare prompt
      const prompt = `
        Generate a personalized workout plan with the following details:
        - Goal: ${goal}
        - Fitness Level: ${fitnessLevel}
        - Days per week: ${daysPerWeek}
        - Duration per workout: ${duration} minutes
        - Available equipment: ${equipment.length > 0 ? equipment.join(", ") : "Bodyweight only"}
        - Additional preferences: ${preferences || "None"}
      `

      // Generate workout plan
      const plan = await generateWorkoutPlan(prompt)

      // Process the response
      setWorkoutPlan(plan)
      setStep(5) // Move to results step
    } catch (error) {
      console.error("Error generating workout plan:", error)
      Alert.alert("Error", "Failed to generate workout plan. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle save plan
  const handleSavePlan = async () => {
    if (!user || !workoutPlan) return

    try {
      // Save to Supabase
      const { error } = await supabaseHelper.insert("workout_plans", {
        user_id: user.id,
        name: workoutPlan.name,
        description: workoutPlan.description,
        goal: workoutPlan.goal,
        difficulty: workoutPlan.difficulty,
        duration: workoutPlan.duration,
        workouts: workoutPlan.workouts,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setShowSaveConfirmation(true)
    } catch (error) {
      console.error("Error saving workout plan:", error)
      Alert.alert("Error", "Failed to save workout plan. Please try again.")
    }
  }

  // Render goal selection
  const renderGoalSelection = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.stepContainer}>
        <Text variant="title" style={styles.stepTitle}>
          What's your fitness goal?
        </Text>
        <Text variant="body" style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
          Select the primary goal for your workout plan.
        </Text>

        <View style={styles.optionsContainer}>
          {goals.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionCard,
                goal === item && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
              ]}
              onPress={() => setGoal(item)}
            >
              <Text variant="subtitle">{item}</Text>
              {goal === item && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Check size={16} color={theme.colors.text.inverse} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    )
  }

  // Render fitness level selection
  const renderFitnessLevelSelection = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.stepContainer}>
        <Text variant="title" style={styles.stepTitle}>
          What's your fitness level?
        </Text>
        <Text variant="body" style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
          This helps us tailor the intensity of your workouts.
        </Text>

        <View style={styles.optionsContainer}>
          {fitnessLevels.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionCard,
                fitnessLevel === item && {
                  borderColor: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}10`,
                },
              ]}
              onPress={() => setFitnessLevel(item)}
            >
              <Text variant="subtitle">{item}</Text>
              {fitnessLevel === item && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Check size={16} color={theme.colors.text.inverse} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    )
  }

  // Render schedule selection
  const renderScheduleSelection = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.stepContainer}>
        <Text variant="title" style={styles.stepTitle}>
          Schedule Preferences
        </Text>
        <Text variant="body" style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
          How often and how long do you want to work out?
        </Text>

        <GlassMorphicCard style={styles.scheduleCard}>
          <Text variant="subtitle">Days per week</Text>
          <View style={styles.daysSelector}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, daysPerWeek === day && { backgroundColor: theme.colors.primary }]}
                onPress={() => setDaysPerWeek(day)}
              >
                <Text
                  variant="button"
                  style={{ color: daysPerWeek === day ? theme.colors.text.inverse : theme.colors.text.primary }}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassMorphicCard>

        <GlassMorphicCard style={styles.scheduleCard}>
          <Text variant="subtitle">Workout duration (minutes)</Text>
          <View style={styles.durationSelector}>
            {[15, 30, 45, 60, 90].map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.durationButton, duration === time && { backgroundColor: theme.colors.primary }]}
                onPress={() => setDuration(time)}
              >
                <Text
                  variant="button"
                  style={{ color: duration === time ? theme.colors.text.inverse : theme.colors.text.primary }}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassMorphicCard>
      </Animated.View>
    )
  }

  // Render equipment selection
  const renderEquipmentSelection = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.stepContainer}>
        <Text variant="title" style={styles.stepTitle}>
          Available Equipment
        </Text>
        <Text variant="body" style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
          Select the equipment you have access to.
        </Text>

        <View style={styles.equipmentContainer}>
          {availableEquipment.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.equipmentItem,
                equipment.includes(item) && {
                  borderColor: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}10`,
                },
              ]}
              onPress={() => handleEquipmentToggle(item)}
            >
              <Text variant="body">{item}</Text>
              {equipment.includes(item) ? (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Check size={16} color={theme.colors.text.inverse} />
                </View>
              ) : (
                <View style={[styles.checkmark, { borderColor: theme.colors.card.border }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <GlassMorphicCard style={styles.preferencesCard}>
          <Text variant="subtitle">Additional Preferences</Text>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginBottom: 8 }}>
            Any specific exercises, areas to focus on, or things to avoid?
          </Text>
          <TextInput
            style={[
              styles.preferencesInput,
              {
                backgroundColor: theme.colors.background.tertiary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.card.border,
              },
            ]}
            placeholder="E.g., Focus on core, avoid high-impact exercises..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={4}
            value={preferences}
            onChangeText={setPreferences}
          />
        </GlassMorphicCard>
      </Animated.View>
    )
  }

  // Render generating plan
  const renderGeneratingPlan = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.stepContainer}>
        <View style={styles.generatingContainer}>
          <View style={[styles.aiIconContainer, { backgroundColor: theme.colors.primary }]}>
            <Brain size={32} color={theme.colors.text.inverse} />
          </View>

          <Text variant="title" style={[styles.stepTitle, { marginTop: 24 }]}>
            {isGenerating ? "Generating Your Plan..." : "Ready to Generate"}
          </Text>

          <Text variant="body" style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
            {isGenerating
              ? "Our AI is creating a personalized workout plan based on your preferences. This may take a moment."
              : "We'll create a personalized workout plan based on your preferences."}
          </Text>

          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <Loader2 size={32} color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.summaryContainer}>
              <GlassMorphicCard style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Target size={20} color={theme.colors.primary} />
                  <Text variant="body" style={{ marginLeft: 8 }}>
                    Goal: {goal}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Dumbbell size={20} color={theme.colors.primary} />
                  <Text variant="body" style={{ marginLeft: 8 }}>
                    Level: {fitnessLevel}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Calendar size={20} color={theme.colors.primary} />
                  <Text variant="body" style={{ marginLeft: 8 }}>
                    {daysPerWeek} days per week
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Clock size={20} color={theme.colors.primary} />
                  <Text variant="body" style={{ marginLeft: 8 }}>
                    {duration} minutes per workout
                  </Text>
                </View>
              </GlassMorphicCard>
            </View>
          )}
        </View>
      </Animated.View>
    )
  }

  // Render workout plan
  const renderWorkoutPlan = () => {
    if (!workoutPlan) return null

    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.stepContainer}>
        <GlassMorphicCard style={styles.planHeaderCard}>
          <LinearGradient
            colors={[
              theme.dark ? "rgba(10, 132, 255, 0.1)" : "rgba(10, 132, 255, 0.05)",
              theme.dark ? "rgba(50, 215, 75, 0.1)" : "rgba(50, 215, 75, 0.05)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Text variant="title">{workoutPlan.name}</Text>
          <Text variant="body" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
            {workoutPlan.description}
          </Text>

          <View style={styles.planStats}>
            <View style={styles.planStat}>
              <Target size={16} color={theme.colors.text.tertiary} />
              <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                {workoutPlan.goal}
              </Text>
            </View>
            <View style={styles.planStat}>
              <Dumbbell size={16} color={theme.colors.text.tertiary} />
              <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                {workoutPlan.difficulty}
              </Text>
            </View>
            <View style={styles.planStat}>
              <Clock size={16} color={theme.colors.text.tertiary} />
              <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                {workoutPlan.duration} min
              </Text>
            </View>
          </View>
        </GlassMorphicCard>

        <Text variant="subtitle" style={styles.workoutsTitle}>
          Workouts
        </Text>

        {workoutPlan.workouts.map((workout, index) => (
          <GlassMorphicCard key={workout.id || index} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View>
                <Text variant="subtitle">{workout.name}</Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  Day {index + 1}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("WorkoutDetail", { workoutId: workout.id })}
              >
                <Text variant="caption" style={{ color: theme.colors.text.inverse }}>
                  View
                </Text>
              </TouchableOpacity>
            </View>

            <Text variant="body" style={{ color: theme.colors.text.secondary, marginVertical: 8 }}>
              {workout.description}
            </Text>

            <Text variant="subtitle" style={{ marginTop: 8, marginBottom: 4 }}>
              Exercises
            </Text>

            {workout.exercises.map((exercise, exIndex) => (
              <View key={exercise.id || exIndex} style={styles.exerciseItem}>
                <View style={styles.exerciseNumber}>
                  <Text variant="caption" style={{ color: theme.colors.text.inverse }}>
                    {exIndex + 1}
                  </Text>
                </View>
                <View style={styles.exerciseDetails}>
                  <Text variant="body">{exercise.name}</Text>
                  <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                    {exercise.sets} sets × {exercise.reps} reps
                  </Text>
                </View>
              </View>
            ))}
          </GlassMorphicCard>
        ))}
      </Animated.View>
    )
  }

  // Render save confirmation
  const renderSaveConfirmation = () => {
    if (!showSaveConfirmation) return null

    return (
      <View style={[StyleSheet.absoluteFill, styles.confirmationOverlay]}>
        <BlurView intensity={30} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <Animated.View
          entering={SlideInUp.springify()}
          exiting={SlideOutDown.springify()}
          style={styles.confirmationCard}
        >
          <View style={styles.confirmationIconContainer}>
            <View style={[styles.confirmationIcon, { backgroundColor: theme.colors.status.success }]}>
              <Check size={32} color={theme.colors.text.inverse} />
            </View>
          </View>

          <Text variant="title" style={{ textAlign: "center", marginTop: 16 }}>
            Workout Plan Saved!
          </Text>
          <Text variant="body" style={{ textAlign: "center", marginTop: 8, color: theme.colors.text.secondary }}>
            Your personalized workout plan has been saved to your profile.
          </Text>

          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationButton, { borderColor: theme.colors.card.border }]}
              onPress={() => {
                setShowSaveConfirmation(false)
                navigation.goBack()
              }}
            >
              <Text variant="button">Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmationButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setShowSaveConfirmation(false)
                navigation.navigate("WorkoutPlans")
              }}
            >
              <Text variant="button" style={{ color: theme.colors.text.inverse }}>
                View Plans
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title">AI Workout Planner</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressSteps}>
        {[1, 2, 3, 4, 5].map((stepNumber) => (
          <View
            key={stepNumber}
            style={[
              styles.progressStep,
              stepNumber <= step && { backgroundColor: theme.colors.primary },
              stepNumber < step && { width: 12 },
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {step === 1 && renderGoalSelection()}
        {step === 2 && renderFitnessLevelSelection()}
        {step === 3 && renderScheduleSelection()}
        {step === 4 && renderEquipmentSelection()}
        {step === 5 && (isGenerating || !workoutPlan ? renderGeneratingPlan() : renderWorkoutPlan())}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {step > 1 && step < 5 && (
          <TouchableOpacity
            style={[styles.navButton, { borderColor: theme.colors.card.border }]}
            onPress={handlePrevStep}
          >
            <Text variant="button">Back</Text>
          </TouchableOpacity>
        )}

        {step < 4 && (
          <AnimatedButton
            title="Next"
            onPress={handleNextStep}
            variant="primary"
            size="large"
            icon={<ChevronRight size={20} color={theme.colors.text.inverse} />}
            iconPosition="right"
            style={{ flex: 1, marginLeft: step > 1 ? 12 : 0 }}
          />
        )}

        {step === 4 && (
          <AnimatedButton
            title="Generate Plan"
            onPress={handleGeneratePlan}
            variant="primary"
            size="large"
            icon={<Brain size={20} color={theme.colors.text.inverse} />}
            style={{ flex: 1, marginLeft: 12 }}
          />
        )}

        {step === 5 && !isGenerating && workoutPlan && (
          <AnimatedButton
            title="Save Plan"
            onPress={handleSavePlan}
            variant="primary"
            size="large"
            icon={<Save size={20} color={theme.colors.text.inverse} />}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* Save Confirmation */}
      {renderSaveConfirmation()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    marginHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    marginBottom: 8,
  },
  stepDescription: {
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
    marginBottom: 12,
    position: "relative",
  },
  checkmark: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleCard: {
    padding: 16,
    marginBottom: 16,
  },
  daysSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  durationSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  durationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  equipmentContainer: {
    marginBottom: 16,
  },
  equipmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
    marginBottom: 12,
  },
  preferencesCard: {
    padding: 16,
  },
  preferencesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  generatingContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    marginTop: 32,
  },
  summaryContainer: {
    width: "100%",
    marginTop: 32,
  },
  summaryCard: {
    padding: 16,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  planHeaderCard: {
    padding: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  planStats: {
    flexDirection: "row",
    marginTop: 16,
  },
  planStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  workoutsTitle: {
    marginBottom: 16,
  },
  workoutCard: {
    padding: 16,
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(10, 132, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseDetails: {
    flex: 1,
  },
  confirmationOverlay: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1000,
  },
  confirmationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  confirmationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(50, 215, 75, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    width: "100%",
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
})
