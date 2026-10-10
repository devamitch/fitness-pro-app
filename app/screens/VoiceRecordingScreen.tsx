"use client"

import { storage } from "@/utils/storage"
import { useNavigation } from "@react-navigation/native"
import { Audio } from "expo-av"
import { ArrowLeft, Mic, MicOff, Pause, Play, Save, Trash2 } from "lucide-react-native"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { VoiceVisualization } from "../components/voice/VoiceVisualization"
import { useVoiceData } from "../hooks/useVoiceData"
import { useTheme } from "../theme/theme"
import { trackEvent, trackScreen } from "../utils/analytics"

interface VoiceNote {
  id: string
  title: string
  audioUri: string
  duration: number
  createdAt: number
}

export const VoiceRecordingScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [audioUri, setAudioUri] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [noteTitle, setNoteTitle] = useState("")

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Use our voice data hook
  const voiceData = useVoiceData({
    isRecording,
    simulateData: true,
    sensitivity: 1,
    baseAmplitude: 0.7,
    baseFrequency: 0.5,
    baseEnergy: 0.8,
  })

  // Track screen view
  useEffect(() => {
    trackScreen("Voice Recording")

    // Request permissions
    Audio.requestPermissionsAsync()

    // Set up audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    })

    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (recording) {
        recording.stopAndUnloadAsync()
      }

      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Start recording
  const startRecording = async () => {
    try {
      // Clear previous recording
      if (recording) {
        await recording.stopAndUnloadAsync()
      }
      if (sound) {
        await sound.unloadAsync()
        setSound(null)
      }

      setAudioUri(null)
      setRecordingDuration(0)
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      )
      setRecording(newRecording)

      trackEvent("Start Voice Recording")
    } catch (error) {
      console.error("Failed to start recording:", error)
      setIsRecording(false)
      Alert.alert("Error", "Failed to start recording. Please try again.")
    }
  }

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!recording) return

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsRecording(false)

      // Stop recording
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setAudioUri(uri || null)

      trackEvent("Stop Voice Recording", { duration: recordingDuration })
    } catch (error) {
      console.error("Failed to stop recording:", error)
      Alert.alert("Error", "Failed to stop recording. Please try again.")
    }
  }

  // Play recorded audio
  const playRecording = async () => {
    try {
      if (!audioUri) return

      if (sound) {
        // If already loaded, toggle play/pause
        if (isPlaying) {
          await sound.pauseAsync()
          setIsPlaying(false)
        } else {
          await sound.playAsync()
          setIsPlaying(true)
        }
      } else {
        // Load and play sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate,
        )
        setSound(newSound)
        setIsPlaying(true)
      }

      trackEvent("Play Voice Recording")
    } catch (error) {
      console.error("Failed to play recording:", error)
      Alert.alert("Error", "Failed to play recording. Please try again.")
    }
  }

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setIsPlaying(false)
    }
  }

  // Save voice note
  const saveVoiceNote = () => {
    if (!audioUri) return

    try {
      // Get existing notes
      const notesJson = storage.getString("voice-notes") || "[]"
      const notes: VoiceNote[] = JSON.parse(notesJson)

      // Create new note
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        title: noteTitle.trim() || `Voice Note ${notes.length + 1}`,
        audioUri,
        duration: recordingDuration,
        createdAt: Date.now(),
      }

      // Save updated notes
      notes.push(newNote)
      storage.set("voice-notes", JSON.stringify(notes))

      trackEvent("Save Voice Note", { duration: recordingDuration })

      // Navigate back
      navigation.goBack()
    } catch (error) {
      console.error("Failed to save voice note:", error)
      Alert.alert("Error", "Failed to save voice note. Please try again.")
    }
  }

  // Discard recording
  const discardRecording = () => {
    Alert.alert("Discard Recording", "Are you sure you want to discard this recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          if (recording) {
            recording.stopAndUnloadAsync()
            setRecording(null)
          }
          if (sound) {
            sound.unloadAsync()
            setSound(null)
          }
          setAudioUri(null)
          setRecordingDuration(0)
          setNoteTitle("")
          setIsRecording(false)

          trackEvent("Discard Voice Recording")
        },
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top || 16,
            backgroundColor: theme.colors.background.secondary,
            borderBottomColor: theme.colors.card.border,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title">Voice Recording</Text>
        <View style={styles.headerRight}>
          {audioUri && (
            <TouchableOpacity style={styles.saveButton} onPress={saveVoiceNote}>
              <Save size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Visualization */}
        <View style={styles.visualizationContainer}>
          <VoiceVisualization
            voiceData={voiceData}
            variant="spectrum"
            size="screen"
            width={300}
            height={200}
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
            animated={isRecording || isPlaying}
          />
        </View>

        {/* Timer */}
        <Text variant="largeTitle" style={[styles.timer, { color: theme.colors.text.primary }]}>
          {formatTime(recordingDuration)}
        </Text>

        {/* Title input (only shown when recording is complete) */}
        {audioUri && (
          <View style={styles.titleContainer}>
            <Text variant="subtitle" style={{ color: theme.colors.text.secondary }}>
              Title
            </Text>
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.card.border,
                },
              ]}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Enter a title for your voice note"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View
        style={[
          styles.controls,
          {
            paddingBottom: insets.bottom || 16,
            backgroundColor: theme.colors.background.secondary,
            borderTopColor: theme.colors.card.border,
          },
        ]}
      >
        {isRecording ? (
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: theme.colors.status.error }]}
              onPress={stopRecording}
            >
              <MicOff size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : audioUri ? (
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.status.error }]}
              onPress={discardRecording}
            >
              <Trash2 size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
              onPress={playRecording}
            >
              {isPlaying ? <Pause size={28} color="#FFFFFF" /> : <Play size={28} color="#FFFFFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.success }]}
              onPress={saveVoiceNote}
            >
              <Save size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startControls}>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
              onPress={startRecording}
            >
              <Mic size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    padding: 24,
  },
  controlButton: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  controls: {
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRight: {
    alignItems: "center",
    width: 40,
  },
  playButton: {
    alignItems: "center",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  playbackControls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  recordingControls: {
    flexDirection: "row",
    justifyContent: "center",
  },
  saveButton: {
    padding: 8,
  },
  startButton: {
    alignItems: "center",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  startControls: {
    flexDirection: "row",
    justifyContent: "center",
  },
  stopButton: {
    alignItems: "center",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  timer: {
    fontSize: 48,
    fontWeight: "600",
    marginVertical: 24,
  },
  titleContainer: {
    marginTop: 24,
    width: "100%",
  },
  titleInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 8,
    padding: 12,
    width: "100%",
  },
  visualizationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
  },
})
