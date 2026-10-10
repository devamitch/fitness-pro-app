import { storage } from "@/utils/storage"
import * as Speech from "expo-speech"

// Define types for TTS options
export interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
  language?: string
}

// Define types for TTS voices
export interface TTSVoice {
  id: string
  name: string
  language: string
  quality: number
}

class TTSService {
  private isInitialized = false
  private isSpeaking = false
  private currentUtteranceId: string | null = null
  private voices: TTSVoice[] = []
  private defaultOptions: TTSOptions = {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: "en-US",
  }

  // Initialize TTS
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true
    }

    try {
      // Load available voices
      await this.loadVoices()

      // Load saved preferences
      this.loadPreferences()

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("Error initializing TTS:", error)
      return false
    }
  }

  // Load available voices
  private async loadVoices(): Promise<void> {
    try {
      const availableVoices = await Speech.getAvailableVoicesAsync()

      // Map to our voice format
      this.voices = availableVoices.map((voice) => ({
        id: voice.identifier,
        name: voice.name,
        language: voice.language,
        quality: voice.quality,
      }))

      // Cache voices
      storage.set("tts_voices", JSON.stringify(this.voices))
    } catch (error) {
      console.error("Error loading TTS voices:", error)

      // Try to load from cache
      const cachedVoices = storage.getString("tts_voices")
      if (cachedVoices) {
        try {
          this.voices = JSON.parse(cachedVoices)
        } catch (e) {
          console.error("Error parsing cached voices:", e)
        }
      }
    }
  }

  // Load saved preferences
  private loadPreferences(): void {
    const savedOptions = storage.getString("tts_options")
    if (savedOptions) {
      try {
        this.defaultOptions = {
          ...this.defaultOptions,
          ...JSON.parse(savedOptions),
        }
      } catch (e) {
        console.error("Error parsing saved TTS options:", e)
      }
    }
  }

  // Save preferences
  savePreferences(options: TTSOptions): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options,
    }

    storage.set("tts_options", JSON.stringify(this.defaultOptions))
  }

  // Get available voices
  getVoices(): TTSVoice[] {
    return this.voices
  }

  // Get voices for a specific language
  getVoicesForLanguage(language: string): TTSVoice[] {
    return this.voices.filter((voice) =>
      voice.language.toLowerCase().startsWith(language.toLowerCase()),
    )
  }

  // Speak text
  async speak(text: string, options?: TTSOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Stop any current speech
    if (this.isSpeaking) {
      await this.stop()
    }

    try {
      const mergedOptions = {
        ...this.defaultOptions,
        ...options,
      }

      // Generate a unique ID for this utterance
      const utteranceId = Date.now().toString()
      this.currentUtteranceId = utteranceId
      this.isSpeaking = true

      // Start speaking
      await Speech.speak(text, {
        voice: mergedOptions.voice,
        rate: mergedOptions.rate,
        pitch: mergedOptions.pitch,
        volume: mergedOptions.volume,
        language: mergedOptions.language,
        onDone: () => {
          if (this.currentUtteranceId === utteranceId) {
            this.isSpeaking = false
            this.currentUtteranceId = null
          }
        },
        onError: (error) => {
          console.error("TTS error:", error)
          if (this.currentUtteranceId === utteranceId) {
            this.isSpeaking = false
            this.currentUtteranceId = null
          }
        },
      })

      return utteranceId
    } catch (error) {
      console.error("Error speaking text:", error)
      this.isSpeaking = false
      this.currentUtteranceId = null
      throw error
    }
  }

  // Stop speaking
  async stop(): Promise<void> {
    try {
      await Speech.stop()
      this.isSpeaking = false
      this.currentUtteranceId = null
    } catch (error) {
      console.error("Error stopping TTS:", error)
    }
  }

  // Check if speaking
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking
  }

  // Get current utterance ID
  getCurrentUtteranceId(): string | null {
    return this.currentUtteranceId
  }
}

export const tts = new TTSService()
