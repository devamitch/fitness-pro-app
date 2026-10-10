"use client"

import Voice, { type SpeechErrorEvent, type SpeechResultsEvent } from "@react-native-voice/voice"
import { useEffect, useState } from "react"

export interface VoiceRecognitionHookResult {
  isListening: boolean
  results: string[]
  error: string | null
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  resetState: () => void
}

export const useVoiceRecognition = (): VoiceRecognitionHookResult => {
  const [isListening, setIsListening] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize Voice
  useEffect(() => {
    // Event listeners
    Voice.onSpeechResults = onSpeechResults
    Voice.onSpeechError = onSpeechError
    Voice.onSpeechStart = () => setIsListening(true)
    Voice.onSpeechEnd = () => setIsListening(false)

    return () => {
      // Clean up
      Voice.destroy().then(Voice.removeAllListeners)
    }
  }, [])

  // Handle speech results
  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      setResults(e.value)
    }
  }

  // Handle speech errors
  const onSpeechError = (e: SpeechErrorEvent) => {
    setError(e.error?.message || "Unknown error")
    setIsListening(false)
  }

  // Start listening
  const startListening = async () => {
    try {
      setError(null)
      setResults([])
      await Voice.start("en-US")
    } catch (e) {
      setError("Failed to start voice recognition")
    }
  }

  // Stop listening
  const stopListening = async () => {
    try {
      await Voice.stop()
      setIsListening(false)
    } catch (e) {
      setError("Failed to stop voice recognition")
    }
  }

  // Reset state
  const resetState = () => {
    setResults([])
    setError(null)
  }

  return {
    isListening,
    results,
    error,
    startListening,
    stopListening,
    resetState,
  }
}
