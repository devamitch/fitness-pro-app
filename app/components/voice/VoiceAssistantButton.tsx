"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from "react-native"
import { useVoiceAssistant } from "../../contexts/VoiceAssistantContext"
import { Text } from "../Text"
import { VoiceVisualization } from "./VoiceVisualization"
import { useVoiceData } from "../../hooks/useVoiceData"
import { useTheme } from "../../theme/theme"
import { Mic, MicOff, X, Settings, Volume2 } from "lucide-react-native"

interface VoiceAssistantButtonProps {
  size?: "small" | "medium" | "large"
  position?: "bottom-right" | "bottom-left" | "bottom-center" | "floating"
  style?: any
  showSettings?: boolean
}

export const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = ({
  size = "medium",
  position = "bottom-right",
  style,
  showSettings = false,
}) => {
  const theme = useTheme()
  const {
    isListening,
    isProcessing,
    isSpeaking,
    startListening,
    stopListening,
    recognizedText,
    lastResponse,
    isEnabled,
    assistantType,
  } = useVoiceAssistant()

  const [modalVisible, setModalVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [animatedValue] = useState(new Animated.Value(0))

  // Use our voice data hook
  const voiceData = useVoiceData({
    isRecording: isListening,
    simulateData: true,
    sensitivity: 1,
    baseAmplitude: 0.6,
    baseFrequency: 0.5,
    baseEnergy: 0.7,
  })

  // Button size based on prop
  const buttonSize = {
    small: 48,
    medium: 56,
    large: 64,
  }[size]

  // Button position based on prop
  const buttonPosition = {
    "bottom-right": { bottom: 24, right: 24 },
    "bottom-left": { bottom: 24, left: 24 },
    "bottom-center": { bottom: 24, right: 24 },
    "bottom-left": { bottom: 24, left: 24 },
    "bottom-center": { bottom: 24, left: "50%", transform: [{ translateX: -buttonSize / 2 }] },
    floating: {},
  }[position]

  // Pulse animation
  useEffect(() => {
    if (isListening || isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isListening, isSpeaking])

  // Animation styles
  const pulseScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  })

  const pulseOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  })

  // Handle button press
  const handlePress = () => {
    if (!isEnabled) return

    if (isListening) {
      stopListening()
    } else {
      setModalVisible(true)
      startListening()
    }
  }

  // Handle close modal
  const handleCloseModal = () => {
    stopListening()
    setModalVisible(false)
  }

  // Handle settings press
  const handleSettingsPress = () => {
    setSettingsVisible(true)
  }

  // Get button color based on state
  const getButtonColor = () => {
    if (!isEnabled) return theme.colors.text.tertiary
    if (isListening) return theme.colors.status.error
    if (isSpeaking) return theme.colors.primary
    return theme.colors.primary
  }

  // Get assistant name
  const getAssistantName = () => {
    switch (assistantType) {
      case "siri":
        return "Siri"
      case "google":
        return "Google Assistant"
      case "alexa":
        return "Alexa"
      default:
        return "Fitness Assistant"
    }
  }

  return (
    <>
      {/* Main Button */}
      <Animated.View
        style={[
          styles.container,
          buttonPosition,
          {
            width: buttonSize,
            height: buttonSize,
            transform: [{ scale: isListening || isSpeaking ? pulseScale : 1 }],
          },
          style,
        ]}
      >
        {/* Pulse Effect */}
        {(isListening || isSpeaking) && (
          <Animated.View
            style={[
              styles.pulse,
              {
                width: buttonSize * 1.5,
                height: buttonSize * 1.5,
                borderRadius: buttonSize * 0.75,
                backgroundColor: getButtonColor(),
                opacity: pulseOpacity,
              },
            ]}
          />
        )}

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: getButtonColor(),
            },
          ]}
          onPress={handlePress}
          disabled={!isEnabled}
        >
          {isListening ? (
            <VoiceVisualization
              voiceData={voiceData}
              variant="circle"
              size="button"
              width={buttonSize * 0.6}
              height={buttonSize * 0.6}
              colors={["#FFFFFF", "#FFFFFF"]}
            />
          ) : isSpeaking ? (
            <Volume2 size={buttonSize * 0.5} color="#FFFFFF" />
          ) : (
            <Mic size={buttonSize * 0.5} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Settings Button */}
        {showSettings && (
          <TouchableOpacity
            style={[
              styles.settingsButton,
              {
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.card.border,
              },
            ]}
            onPress={handleSettingsPress}
          >
            <Settings size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Voice Assistant Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.card.border,
              },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <Text variant="title" style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              {getAssistantName()}
            </Text>

            <View style={styles.visualizationContainer}>
              {isListening ? (
                <VoiceVisualization
                  voiceData={voiceData}
                  variant="circle"
                  size="component"
                  width={150}
                  height={150}
                  colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
                />
              ) : isProcessing ? (
                <View style={styles.processingContainer}>
                  <Text variant="body" style={{ color: theme.colors.text.secondary }}>
                    Processing...
                  </Text>
                </View>
              ) : recognizedText ? (
                <View style={styles.recognizedContainer}>
                  <Text variant="subtitle" style={{ color: theme.colors.primary, textAlign: "center" }}>
                    "{recognizedText}"
                  </Text>
                </View>
              ) : null}
            </View>

            {lastResponse && (
              <View style={styles.responseContainer}>
                <Text variant="body" style={{ color: theme.colors.text.secondary, textAlign: "center" }}>
                  {lastResponse}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.listenButton,
                {
                  backgroundColor: isListening ? theme.colors.status.error : theme.colors.primary,
                },
              ]}
              onPress={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <>
                  <MicOff size={20} color="#FFFFFF" />
                  <Text variant="button" style={[styles.listenButtonText, { color: "#FFFFFF" }]}>
                    Stop Listening
                  </Text>
                </>
              ) : (
                <>
                  <Mic size={20} color="#FFFFFF" />
                  <Text variant="button" style={[styles.listenButtonText, { color: "#FFFFFF" }]}>
                    Start Listening
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      {settingsVisible && (
        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.card.border,
                },
              ]}
            >
              <TouchableOpacity style={styles.closeButton} onPress={() => setSettingsVisible(false)}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              <Text variant="title" style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                Voice Assistant Settings
              </Text>

              {/* Settings content would go here */}
              <Text
                variant="body"
                style={{ color: theme.colors.text.secondary, textAlign: "center", marginVertical: 20 }}
              >
                Voice assistant settings would be displayed here.
              </Text>

              <TouchableOpacity
                style={[styles.listenButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setSettingsVisible(false)}
              >
                <Text variant="button" style={[styles.listenButtonText, { color: "#FFFFFF" }]}>
                  Close Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  pulse: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  settingsButton: {
    position: "absolute",
    top: -40,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  visualizationContainer: {
    marginVertical: 24,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  processingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  recognizedContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  responseContainer: {
    marginBottom: 24,
  },
  listenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
  },
  listenButtonText: {
    marginLeft: 8,
  },
})
