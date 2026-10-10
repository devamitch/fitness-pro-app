"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { Text } from "../components/Text"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { createVoiceCommand } from "../hofs/createVoiceCommand"
import { useVoiceAssistant } from "../contexts/VoiceAssistantContext"
import { VoiceAssistantButton } from "../components/voice/VoiceAssistantButton"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import { VoiceVisualization } from "../components/voice/VoiceVisualization"
import { useVoiceData } from "../hooks/useVoiceData"
import { useTheme } from "../theme/theme"
import { ArrowLeft, Send, Mic, MicOff, Save, Share, Download, Trash } from "lucide-react-native"
import { generateWorkoutPlan } from "../services/openai"
import { useWorkoutPlans } from "../hooks/useWorkoutPlans"
import { useAuthStore } from "../stores/authStore"
import { useQueryClient } from "@tanstack/react-query"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { AnimatedButton } from "../components/AnimatedButton"

const VoiceEnabledAIWorkoutPlanScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { speak, stopSpeaking } = useVoiceAssistant()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState<{ content: string; metadata: any } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState("")
  const [planName, setPlanName] = useState("")

  const scrollViewRef = useRef<ScrollView>(null)

  // Use our React Query hook
  const { plans, isLoading: isLoadingPlans, addPlan, isAddingPlan } = useWorkoutPlans()

  // Voice data for visualization
  const voiceData = useVoiceData({
    isRecording,
    simulateData: true,
    sensitivity: 1,
    baseAmplitude: 0.6,
    baseFrequency: 0.5,
    baseEnergy: 0.7,
  })

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Set plan name from metadata when plan is generated
  useEffect(() => {
    if (workoutPlan?.metadata?.title) {
      setPlanName(workoutPlan.metadata.title)
    }
  }, [workoutPlan])

  // Generate workout plan
  const handleGenerateWorkoutPlan = async () => {
    if (!prompt.trim()) {
      speak("Please enter or speak your workout requirements first.")
      return
    }

    if (!user) {
      speak("You need to be logged in to generate a workout plan.")
      return
    }

    setIsGenerating(true)

    try {
      // Get OpenAI API key from environment variables
      const apiKey = process.env.OPENAI_API_KEY

      if (!apiKey) {
        throw new Error("OpenAI API key not found")
      }

      const plan = await generateWorkoutPlan(prompt, apiKey)
      setWorkoutPlan(plan)

      // Scroll to results
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)

      // Provide voice feedback
      speak("Your workout plan has been generated. Would you like me to explain it?")
    } catch (error) {
      console.error("Error generating workout plan:", error)
      speak("I encountered an error while generating your workout plan. Please try again.")
      Alert.alert("Error", "Failed to generate workout plan. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Start recording
  const handleStartRecording = () => {
    setIsRecording(true)
    speak("I'm listening. Please describe your workout goals and preferences.")

    // In a real app, this would use the device's speech recognition
    // For this example, we'll simulate it with a timeout
    setTimeout(() => {
      handleStopRecording()
    }, 3000)
  }

  // Stop recording
  const handleStopRecording = () => {
    setIsRecording(false)

    // Simulate speech-to-text result
    const simulatedText = "I want a strength training program to build muscle 3 days a week"
    setRecognizedText(simulatedText)
    setPrompt(simulatedText)

    // Provide feedback
    speak("I heard: " + simulatedText)
  }

  // Save workout plan
  const handleSaveWorkoutPlan = async () => {
    if (!workoutPlan || !user) return

    try {
      // Add the plan to Supabase via React Query
      addPlan({
        user_id: user.id,
        name: planName || "Custom Workout Plan",
        description: prompt,
        content: workoutPlan.content,
        is_ai_generated: true,
        metadata: workoutPlan.metadata,
      })

      speak("Workout plan saved successfully.")
      Alert.alert("Success", "Workout plan saved successfully.")

      // Clear the current plan after saving
      setWorkoutPlan(null)
      setPrompt("")
      setPlanName("")
    } catch (error) {
      console.error("Error saving workout plan:", error)
      speak("I encountered an error while saving your workout plan. Please try again.")
      Alert.alert("Error", "Failed to save workout plan. Please try again.")
    }
  }

  // Share workout plan
  const handleShareWorkoutPlan = () => {
    if (workoutPlan) {
      speak("Sharing functionality would be implemented here.")
      // In a real app, this would use the Share API
      Alert.alert("Share", "Sharing functionality would be implemented here.")
    }
  }

  // Explain workout plan
  const handleExplainWorkoutPlan = () => {
    if (workoutPlan) {
      const explanation = `This workout plan is designed for ${workoutPlan.metadata.fitness_level} fitness levels. It focuses on ${workoutPlan.metadata.focus_areas.join(", ")}. The plan recommends working out ${workoutPlan.metadata.frequency} times per week, with each session lasting about ${workoutPlan.metadata.duration} minutes.`

      speak(explanation)
    }
  }

  // Clear workout plan
  const handleClearWorkoutPlan = () => {
    setWorkoutPlan(null)
    setPrompt("")
    setPlanName("")
    speak("Workout plan cleared. You can start over with a new request.")
  }

  // Voice commands
  const workoutPlanCommands = [
    createVoiceCommand(
      {
        id: "workout_generate",
        phrases: ["generate workout plan", "create workout plan", "make workout plan", "plan my workout"],
        category: "workout",
        description: "Generate a workout plan based on your requirements",
        examples: ['"Generate workout plan"', '"Create workout plan"'],
      },
      handleGenerateWorkoutPlan,
    ),
    createVoiceCommand(
      {
        id: "workout_explain",
        phrases: ["explain workout plan", "tell me about this plan", "describe the plan", "explain the workout"],
        category: "workout",
        description: "Get an explanation of the generated workout plan",
        examples: ['"Explain workout plan"', '"Tell me about this plan"'],
      },
      handleExplainWorkoutPlan,
    ),
    createVoiceCommand(
      {
        id: "workout_save",
        phrases: ["save workout plan", "save this plan", "save the workout", "store workout plan"],
        category: "workout",
        description: "Save the generated workout plan",
        examples: ['"Save workout plan"', '"Save this plan"'],
      },
      handleSaveWorkoutPlan,
    ),
    createVoiceCommand(
      {
        id: "workout_share",
        phrases: ["share workout plan", "share this plan", "send workout plan", "share the workout"],
        category: "workout",
        description: "Share the generated workout plan",
        examples: ['"Share workout plan"', '"Send workout plan"'],
      },
      handleShareWorkoutPlan,
    ),
    createVoiceCommand(
      {
        id: "workout_clear",
        phrases: ["clear workout plan", "reset workout plan", "start over", "clear the plan"],
        category: "workout",
        description: "Clear the current workout plan and start over",
        examples: ['"Clear workout plan"', '"Start over"'],
      },
      handleClearWorkoutPlan,
    ),
  ]

  return (
    <VoiceCommandListener commands={workoutPlanCommands}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top || 16,
              backgroundColor: theme.colors.background.secondary,
              borderBottomColor: theme.colors.card.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="title">AI Workout Planner</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Introduction */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text variant="subtitle" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Create Your Personalized Workout Plan
            </Text>
            <Text variant="body" style={[styles.description, { color: theme.colors.text.secondary }]}>
              Describe your fitness goals, experience level, and preferences. Our AI will generate a customized workout
              plan for you.
            </Text>
          </Animated.View>

          {/* Input Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputSection}>
            {isRecording ? (
              <GlassMorphicCard style={styles.recordingContainer}>
                <VoiceVisualization
                  voiceData={voiceData}
                  variant="wave"
                  size="component"
                  width={200}
                  height={60}
                  colors={[theme.colors.primary, theme.colors.secondary]}
                />
                <AnimatedButton
                  style={[styles.recordingButton, { backgroundColor: theme.colors.status.error }]}
                  onPress={handleStopRecording}
                  icon={<MicOff size={20} color="#FFFFFF" />}
                />
              </GlassMorphicCard>
            ) : (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.card.border,
                    },
                  ]}
                  placeholder="Describe your workout requirements..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.inputButtons}>
                  <TouchableOpacity
                    style={[styles.micButton, { backgroundColor: theme.colors.background.secondary }]}
                    onPress={handleStartRecording}
                  >
                    <Mic size={20} color={theme.colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.generateButton,
                      { backgroundColor: theme.colors.primary, opacity: prompt.trim() ? 1 : 0.7 },
                    ]}
                    onPress={handleGenerateWorkoutPlan}
                    disabled={!prompt.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={20} color="#FFFFFF" />
                        <Text variant="button" style={[styles.generateButtonText, { color: "#FFFFFF" }]}>
                          Generate Plan
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>

          {/* Example Prompts */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="subtitle" style={[styles.examplesTitle, { color: theme.colors.text.primary }]}>
              Example Prompts
            </Text>
            <View style={styles.examplesContainer}>
              <TouchableOpacity
                style={[styles.exampleChip, { backgroundColor: theme.colors.background.secondary }]}
                onPress={() =>
                  setPrompt("I'm a beginner looking for a 3-day workout plan to get started with fitness.")
                }
              >
                <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                  Beginner 3-day plan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exampleChip, { backgroundColor: theme.colors.background.secondary }]}
                onPress={() => setPrompt("I want to build muscle with a 4-day strength training program.")}
              >
                <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                  Strength training
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exampleChip, { backgroundColor: theme.colors.background.secondary }]}
                onPress={() => setPrompt("I need a weight loss workout plan with both cardio and strength training.")}
              >
                <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                  Weight loss
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Results */}
          {workoutPlan && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.resultsContainer}>
              <GlassMorphicCard style={styles.resultCard}>
                <View style={[styles.resultHeader, { borderBottomColor: theme.colors.card.border }]}>
                  <TextInput
                    style={[styles.planNameInput, { color: theme.colors.text.primary }]}
                    value={planName}
                    onChangeText={setPlanName}
                    placeholder="Plan Name"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
                      onPress={handleExplainWorkoutPlan}
                    >
                      <Mic size={18} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
                      onPress={handleSaveWorkoutPlan}
                      disabled={isAddingPlan}
                    >
                      {isAddingPlan ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <Save size={18} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
                      onPress={handleShareWorkoutPlan}
                    >
                      <Share size={18} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
                      onPress={handleClearWorkoutPlan}
                    >
                      <Trash size={18} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {workoutPlan.metadata && (
                  <View style={styles.metadataContainer}>
                    <View style={styles.metadataItem}>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        Level
                      </Text>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {workoutPlan.metadata.fitness_level || "Any"}
                      </Text>
                    </View>

                    <View style={styles.metadataItem}>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        Duration
                      </Text>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {workoutPlan.metadata.duration || "Varies"} min
                      </Text>
                    </View>

                    <View style={styles.metadataItem}>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        Frequency
                      </Text>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {workoutPlan.metadata.frequency || "Flexible"}/week
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.workoutPlanContent}>
                  <Text style={{ color: theme.colors.text.primary, lineHeight: 24 }}>{workoutPlan.content}</Text>
                </View>

                <AnimatedButton
                  style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSaveWorkoutPlan}
                  disabled={isAddingPlan}
                  icon={<Download size={20} color="#FFFFFF" />}
                  label="Save Workout Plan"
                  labelStyle={{ color: "#FFFFFF" }}
                  isLoading={isAddingPlan}
                />
              </GlassMorphicCard>
            </Animated.View>
          )}

          {/* Saved Plans Preview */}
          {plans.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.savedPlansContainer}>
              <Text variant="subtitle" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Your Saved Plans
              </Text>
              <TouchableOpacity
                style={[styles.viewAllButton, { borderColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("SavedWorkoutPlans")}
              >
                <Text variant="button" style={{ color: theme.colors.primary }}>
                  View All ({plans.length})
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Voice Assistant Button */}
        <VoiceAssistantButton position="bottom-right" size="medium" />
      </KeyboardAvoidingView>
    </VoiceCommandListener>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 12,
  },
  inputButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  generateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  generateButtonText: {
    marginLeft: 8,
  },
  recordingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
  },
  recordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  examplesTitle: {
    marginBottom: 12,
  },
  examplesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  exampleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  resultsContainer: {
    marginTop: 24,
  },
  resultCard: {
    padding: 0,
    overflow: "hidden",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  planNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    padding: 0,
  },
  resultActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  metadataContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  metadataItem: {
    alignItems: "center",
  },
  workoutPlanContent: {
    padding: 16,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    marginLeft: 8,
  },
  savedPlansContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
})

// Export voice-enabled workout plan screen
export default withVoiceEnabledScreen(VoiceEnabledAIWorkoutPlanScreen, [])
