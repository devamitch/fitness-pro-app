"use client"

import { useState, useEffect } from "react"
import { Audio } from "expo-av"

export interface VoiceDataHookResult {
  voiceData: number[]
  isRecording: boolean
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
}

export const useVoiceData = (): VoiceDataHookResult => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [voiceData, setVoiceData] = useState<number[]>([])
  const [isRecording, setIsRecording] = useState(false)

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync()
      }
    }
  }, [recording])

  // Start listening to audio
  const startListening = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        console.error("Audio recording permissions not granted")
        return
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })

      // Start recording
      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)

      // Set up metering (for visualization)
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Convert dB metering to amplitude (0-1 range)
          const amplitude = Math.min(Math.max((status.metering + 100) / 100, 0), 1)

          // Generate some fake data for visualization
          // In a real app, you'd use actual audio data
          const sampleCount = 20
          const newData = Array(sampleCount)
            .fill(0)
            .map(() => amplitude * (0.5 + Math.random() * 0.5))

          setVoiceData(newData)
        }
      })

      await newRecording.startAsync()
      setRecording(newRecording)
      setIsRecording(true)
    } catch (error) {
      console.error("Failed to start recording", error)
    }
  }

  // Stop listening
  const stopListening = async () => {
    if (!recording) return

    try {
      await recording.stopAndUnloadAsync()
      setRecording(null)
      setIsRecording(false)
      setVoiceData([])
    } catch (error) {
      console.error("Failed to stop recording", error)
    }
  }

  return {
    voiceData,
    isRecording,
    startListening,
    stopListening,
  }
}
