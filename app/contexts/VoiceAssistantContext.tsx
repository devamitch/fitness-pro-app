"use client"

import { storage } from "@/utils/storage"
import { Audio } from "expo-av"
import * as IntentLauncher from "expo-intent-launcher"
import * as Linking from "expo-linking"
import * as Speech from "expo-speech"
import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { AppState, Platform } from "react-native"
import { useAuthStore } from "../stores/authStore"
import { useThemeStore } from "../theme/theme"
import { trackEvent } from "../utils/analytics"

// Define voice assistant types
export type VoiceAssistantType = "app" | "siri" | "google" | "alexa" | "bixby" | "cortana"

// Define voice command types
export type CommandCategory =
  | "navigation"
  | "workout"
  | "profile"
  | "settings"
  | "exercise"
  | "nutrition"
  | "general"

// Define voice command
export interface VoiceCommand {
  id: string
  phrases: string[]
  category: CommandCategory
  action: (params?: any) => void
  description: string
  examples: string[]
  isEnabled: boolean
  requiresAuth?: boolean
  platforms?: ("ios" | "android" | "web")[]
}

// Define voice assistant state
interface VoiceAssistantState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  lastCommand: string | null
  lastResponse: string | null
  error: string | null
  assistantType: VoiceAssistantType
  volume: number
  rate: number
  pitch: number
  voiceType: "male" | "female"
  isEnabled: boolean
  isWakeWordEnabled: boolean
  wakeWord: string
  commands: VoiceCommand[]
  recognizedText: string | null
  confidence: number
}

// Define voice assistant context
interface VoiceAssistantContextType extends VoiceAssistantState {
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  speak: (text: string, options?: SpeakOptions) => Promise<void>
  stopSpeaking: () => Promise<void>
  registerCommand: (command: VoiceCommand) => void
  unregisterCommand: (commandId: string) => void
  executeCommand: (commandText: string) => Promise<boolean>
  setAssistantType: (type: VoiceAssistantType) => void
  setVolume: (volume: number) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVoiceType: (type: "male" | "female") => void
  setEnabled: (enabled: boolean) => void
  setWakeWordEnabled: (enabled: boolean) => void
  setWakeWord: (word: string) => void
  openNativeAssistant: () => Promise<void>
}

// Define speak options
interface SpeakOptions {
  force?: boolean
  onStart?: () => void
  onDone?: () => void
  onError?: (error: any) => void
}

// Create context
const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined)

// Create provider
export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [state, setState] = useState<VoiceAssistantState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    lastCommand: null,
    lastResponse: null,
    error: null,
    assistantType: "app",
    volume: 1.0,
    rate: 0.9,
    pitch: 1.0,
    voiceType: "female",
    isEnabled: true,
    isWakeWordEnabled: false,
    wakeWord: "hey fitness",
    commands: [],
    recognizedText: null,
    confidence: 0,
  })

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const appStateRef = useRef(AppState.currentState)

  // Stores
  const { user } = useAuthStore()
  const { theme } = useThemeStore()

  // Load settings from storage
  useEffect(() => {
    const loadSettings = () => {
      const settings = storage.getString("voice-assistant-settings")
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        setState((prev) => ({
          ...prev,
          ...parsedSettings,
        }))
      }
    }

    loadSettings()
  }, [])

  // Save settings to storage
  useEffect(() => {
    const saveSettings = () => {
      const settings = {
        assistantType: state.assistantType,
        volume: state.volume,
        rate: state.rate,
        pitch: state.pitch,
        voiceType: state.voiceType,
        isEnabled: state.isEnabled,
        isWakeWordEnabled: state.isWakeWordEnabled,
        wakeWord: state.wakeWord,
      }

      storage.set("voice-assistant-settings", JSON.stringify(settings))
    }

    saveSettings()
  }, [
    state.assistantType,
    state.volume,
    state.rate,
    state.pitch,
    state.voiceType,
    state.isEnabled,
    state.isWakeWordEnabled,
    state.wakeWord,
  ])

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        // App has come to the foreground
      } else if (nextAppState.match(/inactive|background/) && appStateRef.current === "active") {
        // App has gone to the background
        stopListening()
        stopSpeaking()
      }

      appStateRef.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening()
      stopSpeaking()
    }
  }, [])

  // Start listening
  const startListening = async () => {
    if (!state.isEnabled) return

    try {
      setState((prev) => ({ ...prev, isListening: true, error: null }))

      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) {
        throw new Error("Audio recording permission not granted")
      }

      // Set up recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      })

      // Start recording
      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await recording.startAsync()
      recordingRef.current = recording

      trackEvent("Voice Assistant Started Listening")

      // Set timeout to stop listening after 10 seconds if no command is detected
      speechTimeoutRef.current = setTimeout(() => {
        stopListening()
      }, 10000)
    } catch (error) {
      console.error("Failed to start listening:", error)
      setState((prev) => ({ ...prev, isListening: false, error: error.message }))
    }
  }

  // Stop listening
  const stopListening = async () => {
    try {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current)
        speechTimeoutRef.current = null
      }

      if (!recordingRef.current) {
        setState((prev) => ({ ...prev, isListening: false }))
        return
      }

      setState((prev) => ({ ...prev, isListening: false, isProcessing: true }))

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync()

      // Get recording URI
      const uri = recordingRef.current.getURI()
      if (!uri) {
        throw new Error("Failed to get recording URI")
      }

      // Process audio (in a real app, you would send this to a speech-to-text service)
      // For demo purposes, we'll simulate recognition
      simulateRecognition()

      recordingRef.current = null

      trackEvent("Voice Assistant Stopped Listening")
    } catch (error) {
      console.error("Failed to stop listening:", error)
      setState((prev) => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        error: error.message,
      }))
    }
  }

  // Simulate speech recognition
  const simulateRecognition = () => {
    // Simulate processing delay
    setTimeout(() => {
      // Generate a random command from the available commands
      const availableCommands = state.commands.filter((cmd) => cmd.isEnabled)
      if (availableCommands.length === 0) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          recognizedText: "No commands available",
          confidence: 0,
        }))
        return
      }

      const randomCommand = availableCommands[Math.floor(Math.random() * availableCommands.length)]
      const randomPhrase =
        randomCommand.phrases[Math.floor(Math.random() * randomCommand.phrases.length)]

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        recognizedText: randomPhrase,
        confidence: 0.8 + Math.random() * 0.2, // Random confidence between 0.8 and 1.0
        lastCommand: randomPhrase,
      }))

      // Execute the command
      executeCommand(randomPhrase)
    }, 1000)
  }

  // Speak text
  const speak = async (text: string, options: SpeakOptions = {}) => {
    if (!state.isEnabled) return

    try {
      if (state.isSpeaking && options.force) {
        await Speech.stop()
      } else if (state.isSpeaking) {
        return
      }

      setState((prev) => ({ ...prev, isSpeaking: true, lastResponse: text }))

      if (options.onStart) {
        options.onStart()
      }

      await Speech.speak(text, {
        language: "en-US",
        voice:
          state.voiceType === "male"
            ? "com.apple.ttsbundle.Daniel-compact"
            : "com.apple.ttsbundle.Samantha-compact",
        rate: state.rate,
        pitch: state.pitch,
        volume: state.volume,
        onDone: () => {
          setState((prev) => ({ ...prev, isSpeaking: false }))
          if (options.onDone) {
            options.onDone()
          }
        },
        onError: (error) => {
          setState((prev) => ({ ...prev, isSpeaking: false, error: error }))
          if (options.onError) {
            options.onError(error)
          }
        },
      })

      trackEvent("Voice Assistant Spoke", { textLength: text.length })
    } catch (error) {
      console.error("Failed to speak:", error)
      setState((prev) => ({ ...prev, isSpeaking: false, error: error.message }))
    }
  }

  // Stop speaking
  const stopSpeaking = async () => {
    try {
      await Speech.stop()
      setState((prev) => ({ ...prev, isSpeaking: false }))

      trackEvent("Voice Assistant Stopped Speaking")
    } catch (error) {
      console.error("Failed to stop speaking:", error)
    }
  }

  // Register command
  const registerCommand = (command: VoiceCommand) => {
    setState((prev) => {
      // Check if command already exists
      const exists = prev.commands.some((cmd) => cmd.id === command.id)
      if (exists) {
        // Update existing command
        return {
          ...prev,
          commands: prev.commands.map((cmd) => (cmd.id === command.id ? command : cmd)),
        }
      } else {
        // Add new command
        return {
          ...prev,
          commands: [...prev.commands, command],
        }
      }
    })
  }

  // Unregister command
  const unregisterCommand = (commandId: string) => {
    setState((prev) => ({
      ...prev,
      commands: prev.commands.filter((cmd) => cmd.id !== commandId),
    }))
  }

  // Execute command
  const executeCommand = async (commandText: string): Promise<boolean> => {
    if (!state.isEnabled) return false

    try {
      // Find matching command
      const matchingCommand = findMatchingCommand(commandText)
      if (!matchingCommand) {
        speak("I'm sorry, I didn't understand that command.")
        return false
      }

      // Check if command requires authentication
      if (matchingCommand.requiresAuth && !user) {
        speak("Please sign in to use this command.")
        return false
      }

      // Check platform compatibility
      if (
        matchingCommand.platforms &&
        matchingCommand.platforms.length > 0 &&
        !matchingCommand.platforms.includes(Platform.OS as "ios" | "android")
      ) {
        speak(`This command is not available on ${Platform.OS}.`)
        return false
      }

      // Execute command action
      matchingCommand.action()

      trackEvent("Voice Command Executed", {
        commandId: matchingCommand.id,
        category: matchingCommand.category,
      })

      return true
    } catch (error) {
      console.error("Failed to execute command:", error)
      setState((prev) => ({ ...prev, error: error.message }))
      speak("I encountered an error while executing that command.")
      return false
    }
  }

  // Find matching command
  const findMatchingCommand = (commandText: string): VoiceCommand | null => {
    const normalizedCommand = commandText.toLowerCase().trim()

    // Find exact match first
    const exactMatch = state.commands.find(
      (cmd) =>
        cmd.isEnabled && cmd.phrases.some((phrase) => phrase.toLowerCase() === normalizedCommand),
    )
    if (exactMatch) return exactMatch

    // Find partial match
    const partialMatch = state.commands.find(
      (cmd) =>
        cmd.isEnabled &&
        cmd.phrases.some((phrase) => normalizedCommand.includes(phrase.toLowerCase())),
    )
    if (partialMatch) return partialMatch

    // Find fuzzy match (contains keywords)
    const words = normalizedCommand.split(" ")
    const fuzzyMatch = state.commands.find(
      (cmd) =>
        cmd.isEnabled &&
        cmd.phrases.some((phrase) => {
          const phraseWords = phrase.toLowerCase().split(" ")
          return phraseWords.some((word) => words.includes(word))
        }),
    )
    if (fuzzyMatch) return fuzzyMatch

    return null
  }

  // Set assistant type
  const setAssistantType = (type: VoiceAssistantType) => {
    setState((prev) => ({ ...prev, assistantType: type }))
  }

  // Set volume
  const setVolume = (volume: number) => {
    setState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }))
  }

  // Set rate
  const setRate = (rate: number) => {
    setState((prev) => ({ ...prev, rate: Math.max(0.1, Math.min(2, rate)) }))
  }

  // Set pitch
  const setPitch = (pitch: number) => {
    setState((prev) => ({ ...prev, pitch: Math.max(0.5, Math.min(2, pitch)) }))
  }

  // Set voice type
  const setVoiceType = (type: "male" | "female") => {
    setState((prev) => ({ ...prev, voiceType: type }))
  }

  // Set enabled
  const setEnabled = (enabled: boolean) => {
    setState((prev) => ({ ...prev, isEnabled: enabled }))
  }

  // Set wake word enabled
  const setWakeWordEnabled = (enabled: boolean) => {
    setState((prev) => ({ ...prev, isWakeWordEnabled: enabled }))
  }

  // Set wake word
  const setWakeWord = (word: string) => {
    setState((prev) => ({ ...prev, wakeWord: word }))
  }

  // Open native assistant
  const openNativeAssistant = async () => {
    try {
      if (Platform.OS === "ios") {
        // Open Siri
        await Linking.openURL("siri://")
      } else if (Platform.OS === "android") {
        // Open Google Assistant
        await IntentLauncher.startActivityAsync("android.intent.action.VOICE_COMMAND", {})
      }

      trackEvent("Opened Native Assistant", { platform: Platform.OS })
    } catch (error) {
      console.error("Failed to open native assistant:", error)
      setState((prev) => ({ ...prev, error: error.message }))
    }
  }

  // Context value
  const value: VoiceAssistantContextType = {
    ...state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    registerCommand,
    unregisterCommand,
    executeCommand,
    setAssistantType,
    setVolume,
    setRate,
    setPitch,
    setVoiceType,
    setEnabled,
    setWakeWordEnabled,
    setWakeWord,
    openNativeAssistant,
  }

  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>
}

// Create hook
export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext)
  if (context === undefined) {
    throw new Error("useVoiceAssistant must be used within a VoiceAssistantProvider")
  }
  return context
}
