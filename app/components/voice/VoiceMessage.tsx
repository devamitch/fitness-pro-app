"use client"

import type React from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"
import { Mic, User } from "lucide-react-native"

export interface VoiceMessageProps {
  message: string
  isUser?: boolean
  timestamp?: string
  style?: ViewStyle
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ message, isUser = false, timestamp, style }) => {
  const { colors } = useTheme()

  return (
    <View
      style={[
        styles.container,
        {
          alignSelf: isUser ? "flex-end" : "flex-start",
        },
        style,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderBottomLeftRadius: isUser ? 16 : 4,
            borderBottomRightRadius: isUser ? 4 : 16,
          },
        ]}
      >
        <View style={styles.header}>
          {isUser ? <User size={16} color={colors.background} /> : <Mic size={16} color={colors.primary} />}
          <Text
            variant="caption"
            style={[
              styles.sender,
              {
                color: isUser ? colors.background : colors.textSecondary,
              },
            ]}
          >
            {isUser ? "You" : "Assistant"}
          </Text>
        </View>

        <Text
          variant="body"
          style={{
            color: isUser ? colors.background : colors.text,
          }}
        >
          {message}
        </Text>

        {timestamp && (
          <Text
            variant="caption"
            style={[
              styles.timestamp,
              {
                color: isUser ? "rgba(255, 255, 255, 0.7)" : colors.textSecondary,
              },
            ]}
          >
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    marginVertical: 4,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sender: {
    marginLeft: 4,
    fontWeight: "bold",
  },
  timestamp: {
    alignSelf: "flex-end",
    marginTop: 4,
    fontSize: 10,
  },
})
