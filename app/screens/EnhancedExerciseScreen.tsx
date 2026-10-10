"use client"

import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Camera } from "expo-camera"
import type { Audio } from "expo-av"
import { Video } from "expo-av"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { Text } from "../components/Text"
import { exerciseApi, progressApi } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import { usePoseDetection } from "../hooks/usePoseDetection" // Updated import
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { createVoiceCommand } from "../hofs/createVoiceCommand"
import { useVoiceAssistant } from "../contexts/VoiceAssistantContext"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import { VoiceAssistantButton } from "../components/voice/VoiceAssistantButton"
import { ArrowLeft, Pause, Play, RotateCcw, Check, Volume2, VolumeX } from "lucide-react-native"
import { useTheme } from "../theme/theme"

const { width, height } = Dimensions.get("window")

const EnhancedExerciseScreen = () => {
  const theme = useTheme()
  const route = useRoute()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { speak, stopSpeaking } = useVoiceAssistant()

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const cameraRef = useRef<Camera>(null)
  const videoRef = useRef<Video>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const videoScale = useSharedValue(0.3)
  const cameraOpacity = useSharedValue(0)
  const resultScale = useSharedValue(0.8)
  const resultOpacity = useSharedValue(0)

  const exerciseId = route.params?.exerciseId

  // Use pose detection hook
  const {
    isInitialized: isPoseInitialized,
    isDetecting: isPoseDetecting,
    currentPose,
    startDetection: startPoseDetection,
    stopDetection: stopPoseDetection,
  } = usePoseDetection({
    engine: "mediapipe",
    enabled: isPlaying && !isPaused,
    onPoseDetected: (pose) => {
      // Update accuracy based on pose data
      if (pose && pose.score) {
        setAccuracy(Math.round(pose.score * 100))
      }
    },
  })

  // Fetch exercise data
  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => exerciseApi.getExerciseById(exerciseId),
  })

  // Request camera permissions
  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    })()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
      stopSpeaking()
      stopPoseDetection()
    }
  }, [])

  // Handle countdown
  useEffect(() => {
    if (countdown > 0 && !isPaused) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)

        // Voice feedback for countdown
        if (!isMuted) {
          speak(`${countdown}`)
        }
      }, 1000)

      return () => clearTimeout(timer)
    } else if (countdown === 0 && !isPlaying && !isPaused) {
      if (!isMuted) {
        speak("Starting exercise now")
      }
      startExercise()
    }
  }, [countdown, isPaused])

  // Start the exercise
  const startExercise = async () => {
    setIsPlaying(true)

    // Animate video to corner
    videoScale.value = withTiming(0.3, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    })

    // Show camera
    cameraOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    })

    // Play video
    if (videoRef.current) {
      await videoRef.current.playAsync()
    }

    // Start pose detection
    await startPoseDetection()

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1

        // Calculate calories (simplified)
        const newCalories = Math.floor(newTime / 10)
        setCaloriesBurned(newCalories)

        // Voice feedback every 30 seconds
        if (newTime % 30 === 0 && !isMuted) {
          speak(`${newTime} seconds elapsed. Keep going!`)
        }

        // Check if exercise is completed
        if (exercise && newTime >= exercise.duration) {
          completeExercise()
        }

        return newTime
      })
    }, 1000)
  }

  // Pause the exercise
  const pauseExercise = async () => {
    setIsPaused(true)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (videoRef.current) {
      await videoRef.current.pauseAsync()
    }

    // Pause pose detection
    await stopPoseDetection()

    if (!isMuted) {
      speak("Exercise paused")
    }
  }

  // Resume the exercise
  const resumeExercise = async () => {
    setIsPaused(false)

    if (videoRef.current) {
      await videoRef.current.playAsync()
    }

    // Resume pose detection
    await startPoseDetection()

    if (!isMuted) {
      speak("Resuming exercise")
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1

        // Calculate calories (simplified)
        const newCalories = Math.floor(newTime / 10)
        setCaloriesBurned(newCalories)

        // Voice feedback every 30 seconds
        if (newTime % 30 === 0 && !isMuted) {
          speak(`${newTime} seconds elapsed. Keep going!`)
        }

        // Check if exercise is completed
        if (exercise && newTime >= exercise.duration) {
          completeExercise()
        }

        return newTime
      })
    }, 1000)
  }

  // Reset the exercise
  const resetExercise = async () => {
    setIsPaused(false)
    setIsPlaying(false)
    setCountdown(3)
    setElapsedTime(0)
    setCaloriesBurned(0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop pose detection
    await stopPoseDetection()

    if (videoRef.current) {
      await videoRef.current.stopAsync()
      await videoRef.current.setPositionAsync(0)
    }

    // Animate video back to full screen
    videoScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    })

    // Hide camera
    cameraOpacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    })

    if (!isMuted) {
      speak("Exercise reset. Ready to start again.")
    }
  }

  // Complete the exercise
  const completeExercise = async () => {
    if (isCompleted) return

    setIsCompleted(true)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop pose detection
    await stopPoseDetection()

    if (videoRef.current) {
      await videoRef.current.stopAsync()
    }

    // Save progress
    if (user && exercise) {
      await progressApi.saveProgress({
        user_id: user.id,
        exercise_id: exercise.id,
        duration: elapsedTime,
        accuracy: accuracy,
        calories_burned: caloriesBurned,
      })
    }

    // Show results
    resultOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    })

    resultScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    })

    if (!isMuted) {
      speak(
        `Congratulations! You've completed the ${exercise?.name} exercise. You burned ${caloriesBurned} calories with ${Math.round(accuracy)}% accuracy.`,
      )
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (isMuted) {
      speak("Voice feedback enabled")
    } else {
      speak("Voice feedback disabled", { force: true })
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Voice commands
  const exerciseCommands = [
    createVoiceCommand(
      {
        id: "exercise_start",
        phrases: ["start exercise", "begin exercise", "start workout", "begin workout"],
        category: "exercise",
        description: "Start the current exercise",
        examples: ['"Start exercise"', '"Begin workout"'],
      },
      () => {
        if (!isPlaying) {
          if (countdown > 0) {
            setCountdown(0)
          } else {
            startExercise()
          }
        }
      },
    ),
    createVoiceCommand(
      {
        id: "exercise_pause",
        phrases: ["pause exercise", "pause workout", "stop exercise", "stop workout"],
        category: "exercise",
        description: "Pause the current exercise",
        examples: ['"Pause exercise"', '"Stop exercise"'],
      },
      () => {
        if (isPlaying && !isPaused) {
          pauseExercise()
        }
      },
    ),
    createVoiceCommand(
      {
        id: "exercise_resume",
        phrases: ["resume exercise", "resume workout", "continue exercise", "continue workout"],
        category: "exercise",
        description: "Resume the paused exercise",
        examples: ['"Resume exercise"', '"Continue workout"'],
      },
      () => {
        if (isPlaying && isPaused) {
          resumeExercise()
        }
      },
    ),
    createVoiceCommand(
      {
        id: "exercise_reset",
        phrases: ["reset exercise", "reset workout", "restart exercise", "restart workout"],
        category: "exercise",
        description: "Reset the current exercise",
        examples: ['"Reset exercise"', '"Restart exercise"'],
      },
      () => {
        resetExercise()
      },
    ),
    createVoiceCommand(
      {
        id: "exercise_mute",
        phrases: ["mute voice", "disable voice", "turn off voice", "silence voice"],
        category: "exercise",
        description: "Mute voice feedback",
        examples: ['"Mute voice"', '"Disable voice"'],
      },
      () => {
        if (!isMuted) {
          toggleMute()
        }
      },
    ),
    createVoiceCommand(
      {
        id: "exercise_unmute",
        phrases: ["unmute voice", "enable voice", "turn on voice", "activate voice"],
        category: "exercise",
        description: "Unmute voice feedback",
        examples: ['"Unmute voice"', '"Enable voice"'],
      },
      () => {
        if (isMuted) {
          toggleMute()
        }
      },
    ),
    createVoiceCommand(
      {
        id: "exercise_status",
        phrases: ["exercise status", "workout status", "how am I doing", "progress update"],
        category: "exercise",
        description: "Get current exercise status",
        examples: ['"Exercise status"', '"How am I doing"'],
      },
      () => {
        if (isPlaying) {
          speak(
            `You've been exercising for ${formatTime(elapsedTime)}. Your form accuracy is ${accuracy}% and you've burned approximately ${caloriesBurned} calories.`,
          )
        } else {
          speak("The exercise hasn't started yet.")
        }
      },
    ),
  ]

  const cameraContainerStyle = useAnimatedStyle(() => ({
    opacity: cameraOpacity.value,
  }))

  const videoContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: videoScale.value }],
    width: withSpring(width * videoScale.value),
    height: withSpring(height * videoScale.value),
    borderRadius: withSpring(videoScale.value < 1 ? 20 : 0),
    position: "absolute",
    top: withSpring(videoScale.value < 1 ? insets.top + 20 : 0),
    right: withSpring(videoScale.value < 1 ? 20 : 0),
    overflow: "hidden",
  }))

  const resultContainerStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }))

  if (isLoading || !exercise) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text variant="title">Loading exercise...</Text>
      </View>
    )
  }

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text variant="title">Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text variant="title">No access to camera</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text variant="button" style={{ color: theme.colors.text.inverse }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <VoiceCommandListener commands={exerciseCommands}>
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        {/* Camera View */}
        <Animated.View style={cameraContainerStyle}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.front}
            autoFocus={Camera.Constants.AutoFocus.on}
          />

          {/* Pose accuracy indicator */}
          <View style={styles.accuracyContainer}>
            <Text variant="subtitle" style={styles.accuracyText}>
              Accuracy: {accuracy}%
            </Text>
            <View style={styles.accuracyBar}>
              <View
                style={[
                  styles.accuracyFill,
                  {
                    width: `${accuracy}%`,
                    backgroundColor:
                      accuracy > 80
                        ? theme.colors.status.success
                        : accuracy > 60
                          ? theme.colors.status.warning
                          : theme.colors.status.error,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Video */}
        <Animated.View style={videoContainerStyle}>
          <Video
            ref={videoRef}
            source={{ uri: exercise.video_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            shouldPlay={false}
            isLooping={true}
          />
        </Animated.View>

        {/* Controls */}
        <View style={[styles.controlsContainer, { paddingBottom: insets.bottom || 20 }]}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top || 20, backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Mute button */}
          <TouchableOpacity
            style={[styles.muteButton, { top: insets.top || 20, backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
            onPress={toggleMute}
          >
            {isMuted ? <VolumeX size={24} color="#FFFFFF" /> : <Volume2 size={24} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Exercise info */}
          <View style={[styles.infoContainer, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
            <Text variant="title" style={styles.exerciseName}>
              {exercise.name}
            </Text>

            {countdown > 0 && !isPlaying && !isPaused ? (
              <View style={styles.countdownContainer}>
                <Text variant="header" style={styles.countdownText}>
                  {countdown}
                </Text>
                <Text variant="subtitle" style={styles.getReadyText}>
                  Get Ready!
                </Text>
              </View>
            ) : (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text variant="caption" style={styles.statLabel}>
                    Time
                  </Text>
                  <Text variant="subtitle" style={styles.statValue}>
                    {formatTime(elapsedTime)} / {formatTime(exercise.duration)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text variant="caption" style={styles.statLabel}>
                    Calories
                  </Text>
                  <Text variant="subtitle" style={styles.statValue}>
                    {caloriesBurned}
                  </Text>
                </View>
              </View>
            )}

            {/* Controls */}
            <View style={styles.buttonContainer}>
              {isPlaying ? (
                <>
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: "rgba(255, 255, 255, 0.2)" }]}
                    onPress={isPaused ? resumeExercise : pauseExercise}
                  >
                    {isPaused ? <Play size={24} color="#FFFFFF" /> : <Pause size={24} color="#FFFFFF" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: "rgba(255, 255, 255, 0.2)" }]}
                    onPress={resetExercise}
                  >
                    <RotateCcw size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setCountdown(3)}
                >
                  <Play size={24} color="#FFFFFF" />
                  <Text variant="button" style={{ color: "#FFFFFF", marginLeft: 8 }}>
                    Start Exercise
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Results */}
        <Animated.View style={resultContainerStyle}>
          <View style={[styles.resultCard, { backgroundColor: theme.colors.background.primary }]}>
            <Text variant="header" style={[styles.resultTitle, { color: theme.colors.text.primary }]}>
              Exercise Completed!
            </Text>

            <View style={styles.resultStats}>
              <View style={styles.resultStatItem}>
                <Text variant="caption" style={[styles.resultStatLabel, { color: theme.colors.text.tertiary }]}>
                  Duration
                </Text>
                <Text variant="title" style={[styles.resultStatValue, { color: theme.colors.primary }]}>
                  {formatTime(elapsedTime)}
                </Text>
              </View>

              <View style={styles.resultStatItem}>
                <Text variant="caption" style={[styles.resultStatLabel, { color: theme.colors.text.tertiary }]}>
                  Accuracy
                </Text>
                <Text variant="title" style={[styles.resultStatValue, { color: theme.colors.primary }]}>
                  {accuracy}%
                </Text>
              </View>

              <View style={styles.resultStatItem}>
                <Text variant="caption" style={[styles.resultStatLabel, { color: theme.colors.text.tertiary }]}>
                  Calories
                </Text>
                <Text variant="title" style={[styles.resultStatValue, { color: theme.colors.primary }]}>
                  {caloriesBurned}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.resultButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Check size={20} color="#FFFFFF" />
              <Text variant="button" style={styles.resultButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Voice Assistant Button */}
        <VoiceAssistantButton position="bottom-right" size="medium" />
      </View>
    </VoiceCommandListener>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  muteButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  exerciseName: {
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 60,
  },
  getReadyText: {
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#FFFFFF",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  resultStats: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  resultStatItem: {
    alignItems: "center",
  },
  resultStatLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resultButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
  },
  cameraContainerStyle: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  accuracyContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    padding: 10,
  },
  accuracyText: {
    color: "#FFFFFF",
    marginBottom: 5,
  },
  accuracyBar: {
    width: 100,
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 5,
    overflow: "hidden",
  },
  accuracyFill: {
    height: "100%",
  },
})

export default withVoiceEnabledScreen(EnhancedExerciseScreen)
