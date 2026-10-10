"use client"

import { useState } from "react"

export interface VoiceCommand {
  command: string
  params: Record<string, any>
  isValid: boolean
}

export interface VoiceCommandsHookResult {
  processCommand: (transcript: string) => VoiceCommand
  availableCommands: string[]
}

export const useVoiceCommands = (): VoiceCommandsHookResult => {
  const [availableCommands, setAvailableCommands] = useState<string[]>([
    "start workout",
    "pause workout",
    "resume workout",
    "stop workout",
    "next exercise",
    "previous exercise",
    "show stats",
    "open profile",
    "go to home",
  ])

  // Process voice command
  const processCommand = (transcript: string): VoiceCommand => {
    const lowerTranscript = transcript.toLowerCase()

    // Check for exact command matches
    for (const cmd of availableCommands) {
      if (lowerTranscript.includes(cmd)) {
        return {
          command: cmd,
          params: {},
          isValid: true,
        }
      }
    }

    // Check for commands with parameters
    if (lowerTranscript.includes("start exercise")) {
      // Extract exercise name
      const match = lowerTranscript.match(/start exercise (.+)/i)
      if (match && match[1]) {
        return {
          command: "start exercise",
          params: { exerciseName: match[1].trim() },
          isValid: true,
        }
      }
    }

    // No valid command found
    return {
      command: "",
      params: {},
      isValid: false,
    }
  }

  return {
    processCommand,
    availableCommands,
  }
}
