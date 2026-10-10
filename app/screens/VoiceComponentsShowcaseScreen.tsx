"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Text } from "../components/Text"
import { useTheme } from "../theme/theme"
import { ArrowLeft } from "lucide-react-native"
import { VoiceVisualizationShowcase } from "../components/voice/VoiceVisualizationShowcase"
import { VoiceButton } from "../components/voice/VoiceButton"
import { VoiceMessage } from "../components/voice/VoiceMessage"
import { VoiceIndicator } from "../components/voice/VoiceIndicator"
import { VoiceActivatedExercise } from "../components/voice/VoiceActivatedExercise"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import { GlassMorphicCard } from "../components/GlassMorphicCard"

export const VoiceComponentsShowcaseScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  // Sample voice commands
  const voiceCommands = [
    {
      command: "Show visualizations",
      action: () => setActiveSection("visualizations"),
    },
    {
      command: "Show voice messages",
      action: () => setActiveSection("messages"),
    },
    {
      command: "Show exercise",
      action: () => setActiveSection("exercise"),
    },
    {
      command: "Go back",
      action: () => navigation.goBack(),
    },
  ]

  // Sample exercise instructions
  const exerciseInstructions = [
    "Stand with your feet shoulder-width apart",
    "Bend your knees and lower your hips as if sitting in a chair",
    "Keep your chest up and back straight",
    "Lower until your thighs are parallel to the ground",
    "Push through your heels to return to the starting position",
  ]

  return (
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
        <Text variant="title">Voice Components</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text variant="title" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Voice Components Showcase
        </Text>

        {/* Voice Buttons */}
        <GlassMorphicCard style={styles.section}>
          <Text variant="subtitle" style={[styles.sectionSubtitle, { color: theme.colors.text.primary }]}>
            Voice Buttons
          </Text>
          <View style={styles.buttonsContainer}>
            <View style={styles.buttonItem}>
              <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                Small
              </Text>
              <VoiceButton
                size="small"
                isRecording={isRecording}
                onStartRecording={() => setIsRecording(true)}
                onStopRecording={() => setIsRecording(false)}
                visualizationVariant="circle"
              />
            </View>

            <View style={styles.buttonItem}>
              <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                Medium
              </Text>
              <VoiceButton
                size="medium"
                isRecording={isRecording}
                onStartRecording={() => setIsRecording(true)}
                onStopRecording={() => setIsRecording(false)}
                visualizationVariant="wave"
              />
            </View>

            <View style={styles.buttonItem}>
              <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                Large
              </Text>
              <VoiceButton
                size="large"
                isRecording={isRecording}
                onStartRecording={() => setIsRecording(true)}
                onStopRecording={() => setIsRecording(false)}
                visualizationVariant="pulse"
              />
            </View>
          </View>
        </GlassMorphicCard>

        {/* Voice Indicators */}
        <GlassMorphicCard style={styles.section}>
          <Text variant="subtitle" style={[styles.sectionSubtitle, { color: theme.colors.text.primary }]}>
            Voice Indicators
          </Text>
          <View style={styles.indicatorsContainer}>
            <View style={styles.indicatorItem}>
              <VoiceIndicator isActive={true} label="Active" variant="bars" size="small" />
            </View>

            <View style={styles.indicatorItem}>
              <VoiceIndicator isActive={false} label="Inactive" variant="wave" size="small" />
            </View>

            <View style={styles.indicatorItem}>
              <VoiceIndicator isActive={true} label="Speaking" variant="dots" size="medium" />
            </View>
          </View>
        </GlassMorphicCard>

        {/* Voice Messages */}
        <GlassMorphicCard style={styles.section}>
          <Text variant="subtitle" style={[styles.sectionSubtitle, { color: theme.colors.text.primary }]}>
            Voice Messages
          </Text>
          <View style={styles.messagesContainer}>
            <VoiceMessage
              audioUri="https://example.com/audio1.mp3"
              duration={45}
              sender="user"
              timestamp="2:30 PM"
              onDelete={() => Alert.alert("Delete", "Message deleted")}
            />

            <VoiceMessage audioUri="https://example.com/audio2.mp3" duration={28} sender="other" timestamp="2:32 PM" />
          </View>
        </GlassMorphicCard>

        {/* Voice Command Listener */}
        <GlassMorphicCard style={styles.section}>
          <Text variant="subtitle" style={[styles.sectionSubtitle, { color: theme.colors.text.primary }]}>
            Voice Command Listeners
          </Text>
          <View style={styles.commandsContainer}>
            <VoiceCommandListener
              commands={voiceCommands}
              variant="inline"
              onCommandRecognized={(command) => Alert.alert("Command Recognized", command)}
            />

            <View style={styles.commandButtonsContainer}>
              <VoiceCommandListener
                commands={voiceCommands}
                variant="modal"
                triggerComponent={
                  <TouchableOpacity style={[styles.commandButton, { backgroundColor: theme.colors.primary }]}>
                    <Text variant="button" style={{ color: "#FFFFFF" }}>
                      Modal Commands
                    </Text>
                  </TouchableOpacity>
                }
              />

              <VoiceCommandListener commands={voiceCommands} variant="floating" />
            </View>
          </View>
        </GlassMorphicCard>

        {/* Voice Activated Exercise */}
        <GlassMorphicCard style={styles.section}>
          <Text variant="subtitle" style={[styles.sectionSubtitle, { color: theme.colors.text.primary }]}>
            Voice Activated Exercise
          </Text>
          <VoiceActivatedExercise
            exerciseName="Bodyweight Squat"
            instructions={exerciseInstructions}
            onComplete={() => Alert.alert("Exercise Complete", "Great job!")}
            onSkip={() => Alert.alert("Exercise Skipped", "Moving to next exercise")}
          />
        </GlassMorphicCard>

        {/* Full Visualization Showcase */}
        {activeSection === "visualizations" && (
          <GlassMorphicCard style={styles.fullShowcaseSection}>
            <VoiceVisualizationShowcase />
          </GlassMorphicCard>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  buttonItem: {
    alignItems: "center",
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  indicatorItem: {
    alignItems: "center",
  },
  messagesContainer: {
    alignItems: "stretch",
  },
  commandsContainer: {
    alignItems: "stretch",
  },
  commandButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  commandButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  fullShowcaseSection: {
    marginBottom: 24,
    padding: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
})
