"use client"

import { useEffect } from "react"
import { useVoiceAssistant, type VoiceCommand } from "../contexts/VoiceAssistantContext"

// Define HOC props
interface WithVoiceCommandsProps {
  commands?: VoiceCommand[]
  voiceEnabled?: boolean
}

// Create HOC
export function withVoiceCommands<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  defaultCommands: VoiceCommand[] = [],
) {
  // Return a new component
  const WithVoiceCommands: React.FC<P & WithVoiceCommandsProps> = (props) => {
    const { commands = [], voiceEnabled = true, ...rest } = props
    const { registerCommand, unregisterCommand } = useVoiceAssistant()

    // Register commands on mount
    useEffect(() => {
      if (!voiceEnabled) return

      // Register all commands
      const allCommands = [...defaultCommands, ...commands]
      allCommands.forEach((command) => {
        registerCommand(command)
      })

      // Unregister commands on unmount
      return () => {
        allCommands.forEach((command) => {
          unregisterCommand(command.id)
        })
      }
    }, [voiceEnabled, commands])

    // Render wrapped component
    return <WrappedComponent {...(rest as P)} />
  }

  // Set display name
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component"
  WithVoiceCommands.displayName = `withVoiceCommands(${displayName})`

  return WithVoiceCommands
}
