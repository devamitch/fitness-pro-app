"use client"

import type React from "react"
import { useState } from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import Animated, { SlideInRight } from "react-native-reanimated"
import { Play } from "lucide-react-native"
import { Text } from "../Text"
import { GlassMorphicCard } from "../GlassMorphicCard"
import { AITextGenerator } from "../animations/AITextGenerator"
import { useTheme } from "../../theme/theme"
import { DynamicAvatar } from "../DynamicAvatar"

interface AnimatedChatMessageProps {
  message: {
    id: string
    content: string
    role: "user" | "assistant" | "system"
    audioUri?: string
    timestamp?: Date
  }
  isGenerating?: boolean
  onPlayAudio?: (audioUri: string) => void
  avatarUri?: string
  isLastMessage?: boolean
  animationStyle?: "typing" | "fade-in" | "word-by-word" | "thinking"
}

export const AnimatedChatMessage: React.FC<AnimatedChatMessageProps> = ({
  message,
  isGenerating = false,
  onPlayAudio,
  avatarUri,
  isLastMessage = false,
  animationStyle = "typing",
}) => {
  const theme = useTheme()
  const isUser = message.role === "user"
  const [isAnimationComplete, setIsAnimationComplete] = useState(!isGenerating)

  const handleAnimationComplete = () => {
    setIsAnimationComplete(true)
  }

  return (
    <Animated.View
      entering={SlideInRight.delay(100).springify()}
      style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.assistantMessageContainer]}
    >
      {!isUser && (
        <DynamicAvatar
          uri={avatarUri || "https://example.com/ai-coach-avatar.jpg"}
          size={40}
          isActive={isLastMessage && !isUser && isGenerating}
          style={styles.avatarImage}
        />
      )}

      <GlassMorphicCard
        style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.assistantMessageBubble]}
        intensity={isUser ? 40 : 60}
      >
        {isUser || !isGenerating || isAnimationComplete ? (
          <Text
            variant="body"
            style={[styles.messageText, { color: isUser ? theme.colors.text.inverse : theme.colors.text.primary }]}
          >
            {message.content}
          </Text>
        ) : (
          <AITextGenerator
            text={message.content}
            animationStyle={animationStyle}
            speed={40}
            textStyle={[styles.messageText, { color: isUser ? theme.colors.text.inverse : theme.colors.text.primary }]}
            onComplete={handleAnimationComplete}
            showSkipButton={true}
          />
        )}

        {message.audioUri && (
          <TouchableOpacity
            style={[styles.audioButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onPlayAudio && onPlayAudio(message.audioUri!)}
          >
            <Play size={16} color={theme.colors.text.inverse} />
            <Text variant="caption" style={[styles.audioButtonText, { color: theme.colors.text.inverse }]}>
              Play Audio
            </Text>
          </TouchableOpacity>
        )}
      </GlassMorphicCard>

      {isUser && <DynamicAvatar uri={avatarUri} size={40} style={styles.avatarImage} />}

      {message.timestamp && (
        <Text variant="caption" style={[styles.timestamp, { color: theme.colors.text.tertiary }]}>
          {formatTime(message.timestamp)}
        </Text>
      )}
    </Animated.View>
  )
}

// Helper function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  avatarImage: {
    marginHorizontal: 8,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "85%",
  },
  userMessageBubble: {
    backgroundColor: "#0A84FF",
    borderTopRightRadius: 4,
  },
  assistantMessageBubble: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    marginTop: 8,
  },
  audioButtonText: {
    marginLeft: 4,
  },
  timestamp: {
    position: "absolute",
    bottom: -20,
    right: 8,
    fontSize: 12,
  },
})
