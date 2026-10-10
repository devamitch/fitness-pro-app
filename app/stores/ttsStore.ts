import { supabase } from "@/services/supabase"
import { storage } from "@/utils/storage"
import * as Speech from "expo-speech"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

// Define TTS options
export interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
  language?: string
  force?: boolean
  onStart?: () => void
  onDone?: () => void
  onError?: (error: any) => void
}

// Define TTS state
interface TTSState {
  enabled: boolean
  speaking: boolean
  paused: boolean
  currentUtterance: string | null
  history: {
    id: string
    text: string
    timestamp: number
    duration?: number
  }[]
  voices: Speech.Voice[]
  settings: {
    voice: string | null
    rate: number
    pitch: number
    volume: number
    language: string
  }

  // Methods
  initialize: () => Promise<void>
  speak: (text: string, options?: TTSOptions) => Promise<void>
  stop: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  setEnabled: (enabled: boolean) => void
  setVoice: (voice: string) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
  setLanguage: (language: string) => void
  getVoices: () => Promise<Speech.Voice[]>
  clearHistory: () => void
}

// Create TTS store
export const useTTSStore = create<TTSState>()(
  persist(
    immer((set, get) => ({
      enabled: true,
      speaking: false,
      paused: false,
      currentUtterance: null,
      history: [],
      voices: [],
      settings: {
        voice: null,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: "en-US",
      },

      initialize: async () => {
        try {
          // Get available voices
          const voices = await Speech.getAvailableVoicesAsync()
          set((state) => {
            state.voices = voices
          })

          // If no voice is set, set a default voice
          if (!get().settings.voice && voices.length > 0) {
            // Find a good quality voice
            const preferredVoice = voices.find(
              (voice) =>
                voice.quality === Speech.VoiceQuality.Enhanced && voice.language.startsWith("en"),
            )
            set((state) => {
              state.settings.voice = preferredVoice?.identifier || voices[0].identifier
            })
          }
        } catch (error) {
          console.error("Failed to initialize TTS:", error)
        }
      },

      speak: async (text, options = {}) => {
        // If TTS is disabled and not forced, return
        if (!get().enabled && !options.force) return

        // If already speaking and not forced, return
        if (get().speaking && !options.force) return

        try {
          // Stop any current speech
          if (get().speaking) {
            await get().stop()
          }

          // Prepare speech options
          const speechOptions: Speech.SpeechOptions = {
            voice: options.voice || get().settings.voice || undefined,
            rate: options.rate || get().settings.rate,
            pitch: options.pitch || get().settings.pitch,
            volume: options.volume || get().settings.volume,
            language: options.language || get().settings.language,
            onStart: () => {
              set((state) => {
                state.speaking = true
                state.paused = false
              })
              options.onStart?.()
            },
            onDone: () => {
              set((state) => {
                state.speaking = false
                state.paused = false
                state.currentUtterance = null
              })
              options.onDone?.()
            },
            onError: (error) => {
              set((state) => {
                state.speaking = false
                state.paused = false
                state.currentUtterance = null
              })
              options.onError?.(error)
              console.error("TTS error:", error)
            },
          }

          // Start speech
          await Speech.speak(text, speechOptions)

          // Add to history
          const id = `tts_${Date.now()}`
          set((state) => {
            state.currentUtterance = text
            state.history.unshift({
              id,
              text,
              timestamp: Date.now(),
            })

            // Limit history to 50 items
            if (state.history.length > 50) {
              state.history = state.history.slice(0, 50)
            }
          })

          // Save to Supabase for analytics
          try {
            await supabase.from("tts_history").insert({
              id,
              user_id: supabase.auth.currentUser?.id,
              text,
              timestamp: new Date().toISOString(),
            })
          } catch (error) {
            console.error("Failed to save TTS history to Supabase:", error)
          }
        } catch (error) {
          console.error("Failed to speak:", error)
          options.onError?.(error)
        }
      },

      stop: async () => {
        try {
          await Speech.stop()
          set((state) => {
            state.speaking = false
            state.paused = false
            state.currentUtterance = null
          })
        } catch (error) {
          console.error("Failed to stop speech:", error)
        }
      },

      pause: async () => {
        if (!get().speaking || get().paused) return

        try {
          await Speech.pause()
          set((state) => {
            state.paused = true
          })
        } catch (error) {
          console.error("Failed to pause speech:", error)
        }
      },

      resume: async () => {
        if (!get().speaking || !get().paused) return

        try {
          await Speech.resume()
          set((state) => {
            state.paused = false
          })
        } catch (error) {
          console.error("Failed to resume speech:", error)
        }
      },

      setEnabled: (enabled) => {
        set((state) => {
          state.enabled = enabled
        })

        // If disabled, stop any current speech
        if (!enabled && get().speaking) {
          get().stop()
        }
      },

      setVoice: (voice) => {
        set((state) => {
          state.settings.voice = voice
        })
      },

      setRate: (rate) => {
        set((state) => {
          state.settings.rate = rate
        })
      },

      setPitch: (pitch) => {
        set((state) => {
          state.settings.pitch = pitch
        })
      },

      setVolume: (volume) => {
        set((state) => {
          state.settings.volume = volume
        })
      },

      setLanguage: (language) => {
        set((state) => {
          state.settings.language = language
        })
      },

      getVoices: async () => {
        try {
          const voices = await Speech.getAvailableVoicesAsync()
          set((state) => {
            state.voices = voices
          })
          return voices
        } catch (error) {
          console.error("Failed to get voices:", error)
          return []
        }
      },

      clearHistory: () => {
        set((state) => {
          state.history = []
        })
      },
    })),
    {
      name: "tts-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name)
          return value ? Promise.resolve(JSON.parse(value)) : Promise.resolve(null)
        },
        setItem: (name, value) => {
          storage.set(name, JSON.stringify(value))
          return Promise.resolve()
        },
        removeItem: (name) => {
          storage.delete(name)
          return Promise.resolve()
        },
      })),
      partialize: (state) => ({
        enabled: state.enabled,
        settings: state.settings,
      }),
    },
  ),
)

// Helper functions for common TTS operations
export const ttsManager = {
  // Initialize TTS
  initialize: async () => {
    await useTTSStore.getState().initialize()
  },

  // Speak text
  speak: async (text: string, options?: TTSOptions) => {
    await useTTSStore.getState().speak(text, options)
  },

  // Stop speech
  stop: async () => {
    await useTTSStore.getState().stop()
  },

  // Pause speech
  pause: async () => {
    await useTTSStore.getState().pause()
  },

  // Resume speech
  resume: async () => {
    await useTTSStore.getState().resume()
  },

  // Check if speaking
  isSpeaking: () => {
    return useTTSStore.getState().speaking
  },

  // Check if paused
  isPaused: () => {
    return useTTSStore.getState().paused
  },

  // Check if enabled
  isEnabled: () => {
    return useTTSStore.getState().enabled
  },

  // Toggle enabled
  toggleEnabled: () => {
    const enabled = useTTSStore.getState().enabled
    useTTSStore.getState().setEnabled(!enabled)
    return !enabled
  },
}
