"use client"

import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { ArrowLeft, Send, Mic, Image as ImageIcon } from "lucide-react-native"

// Message type
interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
}

export const ChatScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi there! I'm your fitness assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const flatListRef = useRef<FlatList>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }, [messages])

  // Send message
  const sendMessage = () => {
    if (message.trim() === "") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getAssistantResponse(message),
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
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

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Render message item
  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === "user"

    return (
      <Animated.View
        entering={isUser ? FadeInUp.delay(100).springify() : FadeInDown.delay(100).springify()}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          index === 0 && { marginTop: 16 },
        ]}
      >
        <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.assistantMessageBubble]}>
          <Text variant="body" style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text variant="caption" style={styles.timestamp}>
          {formatTime(item.timestamp)}
        </Text>
      </Animated.View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text variant="title">Fitness Assistant</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity style={styles.attachButton}>
          <ImageIcon size={24} color="#8E8E93" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        {message.trim() ? (
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Send size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.micButton}>
            <Mic size={24} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
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
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  userMessageBubble: {
    backgroundColor: "#0A84FF",
    borderTopRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 4,
  },
  messageText: {
    color: "#000000",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  timestamp: {
    marginTop: 4,
    alignSelf: "flex-end",
    color: "#8E8E93",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F7",
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
    backgroundColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    padding: 8,
  },
})
