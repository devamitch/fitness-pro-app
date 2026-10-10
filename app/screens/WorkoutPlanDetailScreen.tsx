"use client"

import { useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeIn } from "react-native-reanimated"
import { Text } from "../components/Text"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { createVoiceCommand } from "../hofs/createVoiceCommand"
import { useVoiceAssistant } from "../contexts/VoiceAssistantContext"
import { VoiceAssistantButton } from "../components/voice/VoiceAssistantButton"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import { useTheme } from "../theme/theme"
import { ArrowLeft, Share2, Edit, Play, Calendar, Clock, Dumbbell } from "lucide-react-native"
import { format } from "date-fns"
import { AnimatedButton } from "../components/AnimatedButton"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import type { WorkoutPlan } from "../stores/workoutPlansStore"

const WorkoutPlanDetailScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const { speak, stopSpeaking } = useVoiceAssistant()

  const { plan } = route.params as { plan: WorkoutPlan }

  const scrollViewRef = useRef<ScrollView>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Handle share plan
  const handleSharePlan = async () => {
    try {
      await Share.share({
        message: `Check out my workout plan: ${plan.name}\n\n${plan.content}`,
      })
    } catch (error) {
      console.error("Error sharing workout plan:", error)
      Alert.alert("Error", "Failed to share workout plan.")
    }
  }

  // Handle edit plan
  const handleEditPlan = () => {
    navigation.navigate("EditWorkoutPlan", { plan })
  }

  // Handle start workout
  const handleStartWorkout = () => {
    // In a real app, this would navigate to a workout execution screen
    speak("Starting workout. Get ready!")
    Alert.alert("Start Workout", "This would start the workout in a real app.")
  }

  // Handle explain plan
  const handleExplainPlan = () => {
    const explanation = `This workout plan is called ${plan.name}. It was created on ${formatDate(plan.created_at)}. ${
      plan.metadata?.fitness_level ? `It's designed for ${plan.metadata.fitness_level} fitness levels. ` : ""
    }${plan.metadata?.focus_areas ? `It focuses on ${plan.metadata.focus_areas.join(", ")}. ` : ""}${
      plan.metadata?.frequency ? `The plan recommends working out ${plan.metadata.frequency} times per week. ` : ""
    }${plan.metadata?.duration ? `Each session lasts about ${plan.metadata.duration} minutes. ` : ""}${
      plan.metadata?.equipment && plan.metadata.equipment.length > 0
        ? `You'll need the following equipment: ${plan.metadata.equipment.join(", ")}.`
        : ""
    }`

    speak(explanation)
  }

  // Voice commands
  const planDetailCommands = [
    createVoiceCommand(
      {
        id: "explain_plan",
        phrases: ["explain plan", "tell me about this plan", "describe the plan"],
        category: "workout",
        description: "Get an explanation of the workout plan",
        examples: ['"Explain plan"', '"Tell me about this plan"'],
      },
      handleExplainPlan,
    ),
    createVoiceCommand(
      {
        id: "share_plan",
        phrases: ["share plan", "share this plan", "send plan"],
        category: "workout",
        description: "Share the workout plan",
        examples: ['"Share plan"', '"Send plan"'],
      },
      handleSharePlan,
    ),
    createVoiceCommand(
      {
        id: "edit_plan",
        phrases: ["edit plan", "modify plan", "update plan"],
        category: "workout",
        description: "Edit the workout plan",
        examples: ['"Edit plan"', '"Modify plan"'],
      },
      handleEditPlan,
    ),
    createVoiceCommand(
      {
        id: "start_workout",
        phrases: ["start workout", "begin workout", "let's go"],
        category: "workout",
        description: "Start the workout",
        examples: ['"Start workout"', '"Begin workout"'],
      },
      handleStartWorkout,
    ),
  ]

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (e) {
      return "Unknown date"
    }
  }

  return (
    <VoiceCommandListener commands={planDetailCommands}>
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
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
          <Text variant="title">{plan.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Plan Metadata */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.metadataContainer}>
            <GlassMorphicCard style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <View style={styles.metadataItem}>
                  <Calendar size={16} color={theme.colors.text.tertiary} />
                  <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                    Created: {formatDate(plan.created_at)}
                  </Text>
                </View>

                {plan.metadata?.duration && (
                  <View style={styles.metadataItem}>
                    <Clock size={16} color={theme.colors.text.tertiary} />
                    <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                      {plan.metadata.duration} min/session
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.metadataRow}>
                {plan.metadata?.fitness_level && (
                  <View style={styles.metadataItem}>
                    <Dumbbell size={16} color={theme.colors.text.tertiary} />
                    <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                      Level: {plan.metadata.fitness_level}
                    </Text>
                  </View>
                )}

                {plan.metadata?.frequency && (
                  <View style={styles.metadataItem}>
                    <Calendar size={16} color={theme.colors.text.tertiary} />
                    <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                      {plan.metadata.frequency}x per week
                    </Text>
                  </View>
                )}
              </View>

              {plan.metadata?.focus_areas && plan.metadata.focus_areas.length > 0 && (
                <View style={styles.focusAreasContainer}>
                  <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                    Focus Areas:
                  </Text>
                  <View style={styles.focusAreaTags}>
                    {plan.metadata.focus_areas.map((area, index) => (
                      <View key={index} style={[styles.focusAreaTag, { backgroundColor: theme.colors.primary + "20" }]}>
                        <Text variant="caption" style={{ color: theme.colors.primary }}>
                          {area}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </GlassMorphicCard>
          </Animated.View>

          {/* Plan Content */}
          <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.contentContainer}>
            <GlassMorphicCard style={styles.contentCard}>
              <Text style={{ color: theme.colors.text.primary, lineHeight: 24 }}>{plan.content}</Text>
            </GlassMorphicCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.actionsContainer}>
            <AnimatedButton
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleStartWorkout}
              icon={<Play size={20} color="#FFFFFF" />}
              label="Start Workout"
              labelStyle={{ color: "#FFFFFF" }}
            />

            <View style={styles.secondaryActions}>
              <AnimatedButton
                style={[styles.secondaryButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={handleEditPlan}
                icon={<Edit size={20} color={theme.colors.text.primary} />}
                label="Edit"
                labelStyle={{ color: theme.colors.text.primary }}
              />

              <AnimatedButton
                style={[styles.secondaryButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={handleSharePlan}
                icon={<Share2 size={20} color={theme.colors.text.primary} />}
                label="Share"
                labelStyle={{ color: theme.colors.text.primary }}
              />
            </View>
          </Animated.View>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Voice Assistant Button */}
        <VoiceAssistantButton position="bottom-right" size="medium" />
      </View>
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
  metadataContainer: {
    marginBottom: 16,
  },
  metadataCard: {
    padding: 16,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  focusAreasContainer: {
    marginTop: 8,
  },
  focusAreaTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  focusAreaTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  contentContainer: {
    marginBottom: 24,
  },
  contentCard: {
    padding: 16,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
})

// Export voice-enabled workout plan detail screen
export default withVoiceEnabledScreen(WorkoutPlanDetailScreen, [])
