"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Audio } from "expo-av"
import { Text } from "../components/Text"
import { AnimatedChatMessage } from "../components/chat/AnimatedChatMessage"
import { VoiceButton } from "../components/voice/VoiceButton"
import { useVoiceData } from "../hooks/useVoiceData"
import { VoiceVisualization } from "../components/voice/VoiceVisualization"
import { ArrowLeft, Send, MicOff, Image as ImageIcon } from "lucide-react-native"
import { useTheme } from "../theme/theme"
import { trackScreen, trackEvent } from "../utils/analytics"

// Message type
interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  audioUri?: string
  timestamp: Date
}

export const EnhancedChatScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "👋 Hi there! I'm your fitness assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  const flatListRef = useRef<FlatList>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Use our voice data hook for recording visualization
  const voiceData = useVoiceData({
    isRecording,
    simulateData: true,
    sensitivity: 1,
    baseAmplitude: 0.6,
    baseFrequency: 0.5,
    baseEnergy: 0.7,
  })

  // Track screen view
  useEffect(() => {
    trackScreen("Enhanced Chat")
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  // Send message
  const sendMessage = () => {
    if (message.trim() === "") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")

    // Show generating state
    setIsGenerating(true)

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAssistantResponse(message),
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsGenerating(false)

      trackEvent("AI Response Generated", { length: assistantMessage.content.length })
    }, 500) // Reduced delay since we'll show the typing animation
  }

  // Get assistant response based on user message
  const getAssistantResponse = (userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase()

    if (lowerCaseMessage.includes("exercise") && lowerCaseMessage.includes("recommend")) {
      return "Based on your profile, I recommend trying our 'Full Body HIIT' workout. It's a 30-minute session that targets all major muscle groups. Would you like to see it?"
    } else if (lowerCaseMessage.includes("diet") || lowerCaseMessage.includes("nutrition")) {
      return "For optimal results, try to balance your macronutrients and stay hydrated. Would you like me to suggest a meal plan that complements your workout routine?"
    } else if (lowerCaseMessage.includes("pain") || lowerCaseMessage.includes("injury")) {
      return "I'm sorry to hear that. It's important to rest if you're experiencing pain. Consider consulting a healthcare professional if the pain persists. Would you like some gentle recovery exercises instead?"
    } else if (lowerCaseMessage.includes("progress") || lowerCaseMessage.includes("result")) {
      return "Consistency is key! You've completed 5 workouts this week, which is great progress. Keep it up and you'll reach your goals in no time!"
    } else {
      return "Thanks for your message! Is there anything specific about your fitness journey you'd like help with? I can recommend workouts, provide nutrition tips, or help track your progress."
    }
  }

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      setIsRecording(true)
      setRecordingDuration(0)

      trackEvent("Start Voice Recording")

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)

      // Here you would normally start actual recording
      // For demo purposes, we're just simulating
    } catch (error) {
      console.error("Failed to start recording:", error)
      setIsRecording(false)
    }
  }

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsRecording(false)

      trackEvent("Stop Voice Recording", { duration: recordingDuration })

      // Simulate processing voice message
      setTimeout(() => {
        // Add user voice message
        const userMessage: Message = {
          id: Date.now().toString(),
          content: "I'd like to know more about protein intake for muscle building.",
          role: "user",
          audioUri: "https://example.com/audio.mp3", // This would be the actual recording
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])

        // Show generating state
        setIsGenerating(true)

        // Simulate assistant response
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content:
              "For muscle building, aim for 1.6-2.2g of protein per kg of body weight daily. Spread your intake throughout the day for optimal absorption. Good sources include lean meats, eggs, dairy, legumes, and protein supplements if needed. Would you like me to create a sample meal plan?",
            role: "assistant",
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, assistantMessage])
          setIsGenerating(false)
        }, 1000)
      }, 1500)
    } catch (error) {
      console.error("Failed to process recording:", error)
    } finally {
      setRecordingDuration(0)
    }
  }

  // Handle play audio
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

      trackEvent("Play Audio Message")
    } catch (error) {
      console.error("Failed to play audio:", error)
    }
  }

  // Format time for recording duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
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
          <ArrowLeft size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text variant="title">Fitness Assistant</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item, index }) => (
          <AnimatedChatMessage
            message={item}
            isGenerating={isGenerating && index === messages.length - 1 && item.role === "assistant"}
            onPlayAudio={handlePlayAudio}
            isLastMessage={index === messages.length - 1}
            animationStyle="typing"
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* "AI is typing" indicator */}
      {isGenerating && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.typingIndicator, { backgroundColor: theme.colors.background.secondary }]}
        >
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="caption" style={[styles.typingText, { color: theme.colors.text.secondary }]}>
            AI is typing...
          </Text>
        </Animated.View>
      )}

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
            <TouchableOpacity style={styles.attachButton}>
              <ImageIcon size={24} color={theme.colors.text.tertiary} />
            </TouchableOpacity>

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
            />

            {message.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={sendMessage}
              >
                <Send size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <VoiceButton
                onPress={handleStartRecording}
                size="medium"
                style={styles.micButton}
                colors={[theme.colors.primary, theme.colors.secondary]}
              />
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  typingText: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    marginLeft: 8,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: 20,
    padding: 12,
  },
  recordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
})
