"use client"

import { storage } from "@/utils/storage"
import { useNavigation } from "@react-navigation/native"
import { Audio } from "expo-av"
import { ArrowLeft, Mic, MicOff, Send, Trash2 } from "lucide-react-native"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { DynamicAvatar } from "../components/DynamicAvatar"
import { Text } from "../components/Text"
import { VoiceVisualization } from "../components/voice/VoiceVisualization"
import { useVoiceData } from "../hooks/useVoiceData"
import { aiCoach, type ChatMessage } from "../services/aiCoach"
import { useTheme } from "../theme/theme"
import { trackEvent, trackScreen } from "../utils/analytics"
// Import the new animated text components
import { AnimatedChatMessage } from "../components/chat/AnimatedChatMessage"

export const AICoachScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const scrollViewRef = useRef<ScrollView>(null)

  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  // Use our voice data hook
  const voiceData = useVoiceData({
    isRecording,
    simulateData: true,
    sensitivity: 1,
    baseAmplitude: 0.6,
    baseFrequency: 0.5,
    baseEnergy: 0.7,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentSession = aiCoach.getCurrentSession()
  const messages = currentSession?.messages.filter((msg) => msg.role !== "system") || []

  // Track screen view
  useEffect(() => {
    trackScreen("AI Coach")
  }, [])

  useEffect(() => {
    // Initialize AI coach
    aiCoach.initialize()

    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const trimmedMessage = message.trim()
    setMessage("")

    trackEvent("Send Message", { type: "text" })

    await aiCoach.addTextMessage(trimmedMessage)
  }

  const handleStartRecording = async () => {
    try {
      setIsRecording(true)
      setRecordingDuration(0)

      trackEvent("Start Recording")

      // Start recording
      await aiCoach.startRecording()

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
      setIsRecording(false)
    }
  }

  const handleStopRecording = async () => {
    try {
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsRecording(false)
      setIsProcessing(true)

      trackEvent("Stop Recording", { duration: recordingDuration })

      // Stop recording and process
      await aiCoach.stopRecordingAndProcess()
    } catch (error) {
      console.error("Failed to stop recording:", error)
    } finally {
      setIsProcessing(false)
      setRecordingDuration(0)
    }
  }

  const handlePlayAudio = async (audioUri: string) => {
    try {
      // Unload previous sound
      if (sound) {
        await sound.unloadAsync()
      }

      // Load and play sound
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri })
      setSound(newSound)
      await newSound.playAsync()

      trackEvent("Play Audio")
    } catch (error) {
      console.error("Failed to play audio:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Replace the renderMessage function with this updated version
  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === "user"
    const isLastMessage = index === messages.length - 1

    // Get or create avatar URI
    const getAvatarUri = (isUser: boolean) => {
      if (isUser) {
        return storage.getString("user-avatar-uri") || undefined
      } else {
        return "https://example.com/ai-coach-avatar.jpg"
      }
    }

    return (
      <AnimatedChatMessage
        key={msg.id}
        message={msg}
        isGenerating={isProcessing && isLastMessage && !isUser}
        onPlayAudio={handlePlayAudio}
        avatarUri={getAvatarUri(isUser)}
        isLastMessage={isLastMessage}
        animationStyle="typing"
      />
    )
  }

  return (
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
        <Text variant="title">AI Fitness Coach</Text>
        <TouchableOpacity style={styles.trashButton} onPress={() => aiCoach.clearSession()}>
          <Trash2 size={20} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <DynamicAvatar
              uri="https://example.com/ai-coach-avatar.jpg"
              size={80}
              isActive={true}
              style={styles.welcomeAvatar}
            />

            <Text
              variant="title"
              style={[styles.welcomeTitle, { color: theme.colors.text.primary }]}
            >
              Welcome to your AI Fitness Coach
            </Text>
            <Text
              variant="body"
              style={[styles.welcomeText, { color: theme.colors.text.secondary }]}
            >
              Ask me anything about fitness, workouts, nutrition, or your training plan. I'm here to
              help you achieve your goals!
            </Text>
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity
                style={[
                  styles.suggestionButton,
                  { backgroundColor: theme.colors.background.secondary },
                ]}
                onPress={() => aiCoach.addTextMessage("Create a workout plan for me")}
              >
                <Text variant="caption" style={{ color: theme.colors.primary }}>
                  Create a workout plan for me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.suggestionButton,
                  { backgroundColor: theme.colors.background.secondary },
                ]}
                onPress={() => aiCoach.addTextMessage("How can I improve my squat form?")}
              >
                <Text variant="caption" style={{ color: theme.colors.primary }}>
                  How can I improve my squat form?
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.suggestionButton,
                  { backgroundColor: theme.colors.background.secondary },
                ]}
                onPress={() => aiCoach.addTextMessage("What should I eat before a workout?")}
              >
                <Text variant="caption" style={{ color: theme.colors.primary }}>
                  What should I eat before a workout?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.map(renderMessage)}

        {/* Loading indicator */}
        {isProcessing && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginLeft: 8 }}>
              Processing...
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: insets.bottom || 16,
            backgroundColor: theme.colors.background.secondary,
            borderTopColor: theme.colors.card.border,
          },
        ]}
      >
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <VoiceVisualization
              voiceData={voiceData}
              variant="wave"
              size="component"
              width={200}
              height={60}
              colors={[theme.colors.primary, theme.colors.secondary]}
            />
            <Text variant="body" style={{ color: theme.colors.text.primary, marginLeft: 8 }}>
              {formatTime(recordingDuration)}
            </Text>
            <TouchableOpacity
              style={[styles.recordingButton, { backgroundColor: theme.colors.status.error }]}
              onPress={handleStopRecording}
            >
              <MicOff size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />

            {message.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSendMessage}
                disabled={isProcessing}
              >
                <Send size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.micButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleStartRecording}
                disabled={isProcessing}
              >
                <Mic size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  assistantMessageBubble: {
    borderTopLeftRadius: 4,
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  audioButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    marginTop: 8,
    padding: 8,
  },
  audioButtonText: {
    marginLeft: 4,
  },
  avatarImage: {
    marginHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  input: {
    borderRadius: 20,
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputContainer: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    marginTop: 8,
  },
  messageBubble: {
    borderRadius: 16,
    maxWidth: "85%",
    padding: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  micButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginLeft: 8,
    width: 40,
  },
  recordingButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginLeft: 8,
    width: 40,
  },
  recordingContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: 20,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  sendButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginLeft: 8,
    width: 40,
  },
  suggestionButton: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  suggestionsContainer: {
    width: "100%",
  },
  trashButton: {
    padding: 8,
  },
  userMessageBubble: {
    backgroundColor: "#0A84FF",
    borderTopRightRadius: 4,
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row",
  },
  welcomeAvatar: {
    marginBottom: 16,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
  },
  welcomeText: {
    marginBottom: 24,
    textAlign: "center",
  },
  welcomeTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
})
