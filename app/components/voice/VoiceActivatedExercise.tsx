"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { VoiceVisualization } from "./VoiceVisualization"
import { VoiceIndicator } from "./VoiceIndicator"
import { Text } from "../Text"
import { useTheme } from "../../theme/theme"
import { GlassMorphicCard } from "../GlassMorphicCard"
import { Mic, Volume2, VolumeX } from "lucide-react-native"

interface VoiceActivatedExerciseProps {
  exerciseName: string
  instructions: string[]
  onComplete: () => void
  onSkip: () => void
  style?: any
}

export const VoiceActivatedExercise: React.FC<VoiceActivatedExerciseProps> = ({
  exerciseName,
  instructions,
  onComplete,
  onSkip,
  style,
}) => {
  const theme = useTheme()
  const [isListening, setIsListening] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  // Simulated voice data
  const voiceData = {
    amplitude: isListening ? 0.5 + Math.random() * 0.5 : 0.1,
    frequency: isListening ? 0.4 + Math.random() * 0.3 : 0.3,
    speaking: isListening,
    pauseDuration: isListening ? 0 : 1000,
    energy: isListening ? 0.6 + Math.random() * 0.4 : 0.2,
  }

  // Toggle voice listening
  const toggleListening = () => {
    setIsListening(!isListening)
  }

  // Toggle voice guidance
  const toggleVoiceGuidance = () => {
    setVoiceEnabled(!voiceEnabled)
  }

  // Simulate voice recognition for advancing steps
  useEffect(() => {
    if (isListening) {
      const timer = setTimeout(
        () => {
          // Simulate voice recognition
          if (currentStep < instructions.length - 1) {
            setCurrentStep(currentStep + 1)
          } else {
            setIsListening(false)
            onComplete()
          }
        },
        3000 + Math.random() * 2000,
      )

      return () => clearTimeout(timer)
    }
  }, [isListening, currentStep])

  // Simulate voice guidance
  useEffect(() => {
    if (voiceEnabled && !isSpeaking) {
      setIsSpeaking(true)

      // Simulate voice speaking duration
      const timer = setTimeout(
        () => {
          setIsSpeaking(false)
        },
        2000 + instructions[currentStep].length * 50,
      )

      return () => clearTimeout(timer)
    }
  }, [currentStep, voiceEnabled])

  return (
    <GlassMorphicCard style={[styles.container, style]} intensity={60}>
      <View style={styles.header}>
        <Text variant="title" style={[styles.title, { color: theme.colors.text.primary }]}>
          {exerciseName}
        </Text>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleVoiceGuidance}>
            {voiceEnabled ? (
              <Volume2 size={20} color={theme.colors.primary} />
            ) : (
              <VolumeX size={20} color={theme.colors.text.tertiary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stepsContainer}>
        {instructions.map((instruction, index) => (
          <View
            key={index}
            style={[
              styles.stepItem,
              {
                backgroundColor:
                  index === currentStep
                    ? `${theme.colors.primary}20`
                    : index < currentStep
                      ? `${theme.colors.success}10`
                      : "transparent",
                borderColor: theme.colors.card.border,
              },
            ]}
          >
            <View
              style={[
                styles.stepNumber,
                {
                  backgroundColor:
                    index === currentStep
                      ? theme.colors.primary
                      : index < currentStep
                        ? theme.colors.success
                        : theme.colors.background.tertiary,
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color:
                    index === currentStep || index < currentStep
                      ? theme.colors.text.inverse
                      : theme.colors.text.tertiary,
                }}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              variant="body"
              style={[
                styles.stepText,
                {
                  color:
                    index === currentStep
                      ? theme.colors.text.primary
                      : index < currentStep
                        ? theme.colors.text.secondary
                        : theme.colors.text.tertiary,
                  fontWeight: index === currentStep ? "600" : "400",
                },
              ]}
            >
              {instruction}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {voiceEnabled && (
          <VoiceIndicator
            isActive={isSpeaking}
            label="Coach"
            variant="bars"
            size="small"
            style={styles.voiceIndicator}
          />
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.skipButton, { borderColor: theme.colors.card.border }]} onPress={onSkip}>
            <Text variant="button" style={{ color: theme.colors.text.secondary }}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.listenButton,
              { backgroundColor: isListening ? theme.colors.status.error : theme.colors.primary },
            ]}
            onPress={toggleListening}
          >
            <Mic size={20} color="#FFFFFF" />
            <Text variant="button" style={[styles.listenButtonText, { color: "#FFFFFF" }]}>
              {isListening ? "Listening..." : "Next Step"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isListening && (
        <View style={styles.listeningOverlay}>
          <VoiceVisualization
            voiceData={voiceData}
            variant="circle"
            size="component"
            width={120}
            height={120}
            colors={[theme.colors.primary, theme.colors.secondary]}
          />
          <Text variant="subtitle" style={[styles.listeningText, { color: theme.colors.text.primary }]}>
            Listening...
          </Text>
        </View>
      )}
    </GlassMorphicCard>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
  },
  controls: {
    flexDirection: "row",
  },
  controlButton: {
    padding: 8,
  },
  stepsContainer: {
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepText: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voiceIndicator: {
    marginRight: 16,
  },
  actionButtons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  listenButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  listenButtonText: {
    marginLeft: 8,
  },
  listeningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  listeningText: {
    marginTop: 16,
  },
})
