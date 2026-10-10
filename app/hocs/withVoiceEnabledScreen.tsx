"use client"

import type React from "react"
import { useNavigation, useRoute } from "@react-navigation/native"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import type { VoiceCommand } from "../contexts/VoiceAssistantContext"
import { createNavigationCommand } from "../hofs/createVoiceCommand"

// Define HOC props
interface WithVoiceEnabledScreenProps {
  screenName: string
  commands?: VoiceCommand[]
  voiceEnabled?: boolean
}

// Create HOC
export function withVoiceEnabledScreen<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  defaultCommands: VoiceCommand[] = [],
) {
  // Return a new component
  const WithVoiceEnabledScreen: React.FC<P & WithVoiceEnabledScreenProps> = (props) => {
    const { screenName, commands = [], voiceEnabled = true, ...rest } = props
    const navigation = useNavigation()
    const route = useRoute()

    // Create default navigation commands for this screen
    const navigationCommands = [
      createNavigationCommand("back", "back", () => navigation.goBack(), ["go back", "previous screen", "back"]),
    ]

    // Combine all commands
    const allCommands = [...navigationCommands, ...defaultCommands, ...commands]

    // Render wrapped component with voice command listener
    return (
      <VoiceCommandListener commands={allCommands} enabled={voiceEnabled}>
        <WrappedComponent {...(rest as P)} />
      </VoiceCommandListener>
    )
  }

  // Set display name
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component"
  WithVoiceEnabledScreen.displayName = `withVoiceEnabledScreen(${displayName})`

  return WithVoiceEnabledScreen
}
