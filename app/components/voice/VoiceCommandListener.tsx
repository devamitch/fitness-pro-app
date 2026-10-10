"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, AppState, type AppStateStatus } from "react-native"
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition"
import { useVoiceCommands } from "@/hooks/useVoiceCommands"
import { VoiceIndicator } from "./VoiceIndicator"

export interface VoiceCommandListenerProps {
  enabled?: boolean
  children?: React.ReactNode
  onCommand?: (command: string, params: Record<string, any>) => void
}

export const VoiceCommandListener: React.FC<VoiceCommandListenerProps> = ({ enabled = true, children, onCommand }) => {
  const [isActive, setIsActive] = useState(enabled)
  const { startListening, stopListening, results, isListening } = useVoiceRecognition()
  const { processCommand } = useVoiceCommands()

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isActive) {
        startListening()
      } else if (nextAppState !== "active" && isListening) {
        stopListening()
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [isActive, isListening])

  // Start/stop listening based on enabled prop
  useEffect(() => {
    setIsActive(enabled)

    if (enabled && !isListening) {
      startListening()
    } else if (!enabled && isListening) {
      stopListening()
    }

    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [enabled])

  // Process voice recognition results
  useEffect(() => {
    if (results && results.length > 0) {
      const transcript = results[0]

      // Process the command
      const { command, params, isValid } = processCommand(transcript)

      if (isValid && onCommand) {
        onCommand(command, params)
      }

      // Restart listening after processing
      setTimeout(() => {
        if (isActive) {
          startListening()
        }
      }, 1000)
    }
  }, [results])

  return (
    <View style={styles.container}>
      {children}

      {isListening && (
        <VoiceIndicator isListening={isListening} text="Listening for commands" style={styles.indicator} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicator: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    zIndex: 1000,
  },
})
