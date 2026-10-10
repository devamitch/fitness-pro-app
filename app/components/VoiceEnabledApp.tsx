"use client"

import type React from "react"
import { View, StyleSheet } from "react-native"
import { VoiceAssistantProvider } from "../contexts/VoiceAssistantContext"
import { VoiceAssistantButton } from "./voice/VoiceAssistantButton"
import { initializeGlobalCommands } from "../services/voiceCommandRegistry"

interface VoiceEnabledAppProps {
  children: React.ReactNode
  showVoiceButton?: boolean
  voiceButtonPosition?: "bottom-right" | "bottom-left" | "bottom-center" | "floating"
  voiceButtonSize?: "small" | "medium" | "large"
}

export const VoiceEnabledApp: React.FC<VoiceEnabledAppProps> = ({
  children,
  showVoiceButton = true,
  voiceButtonPosition = "bottom-right",
  voiceButtonSize = "medium",
}) => {
  // Initialize global commands
  initializeGlobalCommands()

  return (
    <VoiceAssistantProvider>
      <View style={styles.container}>
        {children}
        {showVoiceButton && <VoiceAssistantButton position={voiceButtonPosition} size={voiceButtonSize} showSettings />}
      </View>
    </VoiceAssistantProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
