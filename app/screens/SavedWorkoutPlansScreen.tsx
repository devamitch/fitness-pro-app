"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { Text } from "../components/Text"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { createVoiceCommand } from "../hofs/createVoiceCommand"
import { useVoiceAssistant } from "../contexts/VoiceAssistantContext"
import { VoiceAssistantButton } from "../components/voice/VoiceAssistantButton"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import { useTheme } from "../theme/theme"
import { ArrowLeft, Trash, Edit, Eye, Calendar, Clock, Dumbbell } from "lucide-react-native"
import { useWorkoutPlans } from "../hooks/useWorkoutPlans"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { format } from "date-fns"

const SavedWorkoutPlansScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { speak } = useVoiceAssistant()

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const { plans, isLoading, isError, error, refetch, deletePlan, isDeletingPlan } = useWorkoutPlans()

  // Handle view plan
  const handleViewPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      navigation.navigate("WorkoutPlanDetail", { plan })
    }
  }

  // Handle edit plan
  const handleEditPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      navigation.navigate("EditWorkoutPlan", { plan })
    }
  }

  // Handle delete plan
  const handleDeletePlan = (planId: string) => {
    Alert.alert("Delete Plan", "Are you sure you want to delete this workout plan?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deletePlan(planId)
          speak("Workout plan deleted successfully.")
        },
      },
    ])
  }

  // Voice commands
  const savedPlansCommands = [
    createVoiceCommand(
      {
        id: "refresh_plans",
        phrases: ["refresh plans", "reload plans", "update plans"],
        category: "workout",
        description: "Refresh the list of saved workout plans",
        examples: ['"Refresh plans"'],
      },
      () => refetch(),
    ),
    createVoiceCommand(
      {
        id: "view_plan",
        phrases: ["view plan", "open plan", "show plan"],
        category: "workout",
        description: "View a specific workout plan",
        examples: ['"View plan"'],
      },
      () => {
        if (selectedPlanId) {
          handleViewPlan(selectedPlanId)
        } else {
          speak("Please select a plan first.")
        }
      },
    ),
    createVoiceCommand(
      {
        id: "delete_plan",
        phrases: ["delete plan", "remove plan"],
        category: "workout",
        description: "Delete a specific workout plan",
        examples: ['"Delete plan"'],
      },
      () => {
        if (selectedPlanId) {
          handleDeletePlan(selectedPlanId)
        } else {
          speak("Please select a plan first.")
        }
      },
    ),
  ]

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (e) {
      return "Unknown date"
    }
  }

  return (
    <VoiceCommandListener commands={savedPlansCommands}>
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
          <Text variant="title">Saved Workout Plans</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && !isDeletingPlan}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {isError && (
            <View style={styles.errorContainer}>
              <Text variant="body" style={{ color: theme.colors.status.error, textAlign: "center" }}>
                {error instanceof Error ? error.message : "Failed to load workout plans"}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => refetch()}
              >
                <Text variant="button" style={{ color: "#FFFFFF" }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isError && plans.length === 0 && !isLoading && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
              <Text variant="subtitle" style={{ color: theme.colors.text.secondary, textAlign: "center" }}>
                You don't have any saved workout plans yet.
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("VoiceEnabledAIWorkoutPlan")}
              >
                <Text variant="button" style={{ color: "#FFFFFF" }}>
                  Create New Plan
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {plans.map((plan, index) => (
            <Animated.View
              key={plan.id}
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.planItemContainer}
            >
              <GlassMorphicCard
                style={[
                  styles.planCard,
                  selectedPlanId === plan.id && { borderColor: theme.colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                <View style={styles.planHeader}>
                  <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    {plan.name}
                  </Text>
                  <View style={styles.planActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background.tertiary }]}
                      onPress={() => handleViewPlan(plan.id)}
                    >
                      <Eye size={18} color={theme.colors.text.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background.tertiary }]}
                      onPress={() => handleEditPlan(plan.id)}
                    >
                      <Edit size={18} color={theme.colors.text.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.status.error + "20" }]}
                      onPress={() => handleDeletePlan(plan.id)}
                      disabled={isDeletingPlan}
                    >
                      {isDeletingPlan && selectedPlanId === plan.id ? (
                        <ActivityIndicator size="small" color={theme.colors.status.error} />
                      ) : (
                        <Trash size={18} color={theme.colors.status.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text
                  variant="body"
                  style={{ color: theme.colors.text.secondary, marginVertical: 8 }}
                  numberOfLines={2}
                >
                  {plan.description}
                </Text>

                <View style={styles.planMetadata}>
                  <View style={styles.metadataItem}>
                    <Calendar size={14} color={theme.colors.text.tertiary} />
                    <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                      {formatDate(plan.created_at)}
                    </Text>
                  </View>

                  {plan.metadata?.duration && (
                    <View style={styles.metadataItem}>
                      <Clock size={14} color={theme.colors.text.tertiary} />
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                        {plan.metadata.duration} min
                      </Text>
                    </View>
                  )}

                  {plan.metadata?.fitness_level && (
                    <View style={styles.metadataItem}>
                      <Dumbbell size={14} color={theme.colors.text.tertiary} />
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 4 }}>
                        {plan.metadata.fitness_level}
                      </Text>
                    </View>
                  )}
                </View>
              </GlassMorphicCard>
            </Animated.View>
          ))}

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
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  planItemContainer: {
    marginBottom: 16,
  },
  planCard: {
    padding: 16,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  planMetadata: {
    flexDirection: "row",
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
})

// Export voice-enabled saved workout plans screen
export default withVoiceEnabledScreen(SavedWorkoutPlansScreen, [])
