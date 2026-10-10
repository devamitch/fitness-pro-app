"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import type { Audio } from "expo-av"
import { Video } from "expo-av"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { Text } from "../../components/Text"
import { PoseDetectionCamera } from "../../components/PoseDetectionCamera"
import { exerciseApi, progressApi } from "../../services/api"
import { useAuthStore } from "../../stores/authStore"
import { usePoseDetection } from "../../hooks/usePoseDetection"
import { withVoiceEnabledScreen } from "../../hocs/withVoiceEnabledScreen"
import { createVoiceCommand } from "../../utils/createVoiceCommand"
import { useVoiceAssistant } from "../../providers/VoiceEnabledProvider"
import { VoiceCommandListener } from "../../components/voice/VoiceCommandListener"
import { VoiceAssistantButton } from "../../components/voice/VoiceAssistantButton"
import { ArrowLeft, Pause, Play, RotateCcw, Check, Volume2, VolumeX } from "lucide-react-native"
import { useTheme } from "../../theme"
import { useIsForeground } from "../../hooks/useIsForeground"
import { useAppState } from "../../hooks/useAppState"
import type { PoseData } from "../../services/pose-detection/types"

const { width, height } = Dimensions.get("window")

const EnhancedExerciseScreen = () => {
  const { colors } = useTheme()
  const route = useRoute()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { speak, stopSpeaking } = useVoiceAssistant()
  const isForeground = useIsForeground()
  const appState = useAppState()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [shouldDetect, setShouldDetect] = useState(false)

  const videoRef = useRef<Video>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPoseTimeRef = useRef<number>(Date.now())

  const videoScale = useSharedValue(0.3)
  const cameraOpacity = useSharedValue(0)
  const resultScale = useSharedValue(0.8)
  const resultOpacity = useSharedValue(0)

  const exerciseId = route.params?.exerciseId

  // Handle pose detection
  const { currentPose, detectRepetition, comparePoseWithForm } = usePoseDetection({
    enabled: shouldDetect && isPlaying && !isPaused && isForeground && appState === "active",
    onPoseDetected: handlePoseDetected,
  })

  // Fetch exercise data
  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => exerciseApi.getExerciseById(exerciseId),
  })

  // Handle pose detection
  function handlePoseDetected(pose: PoseData) {
    if (!isPlaying || isPaused || isCompleted) return

    // Update last pose time
    lastPoseTimeRef.current = Date.now()

    // Update accuracy based on pose score
    const newAccuracy = Math.round(pose.score * 100)
    setAccuracy(newAccuracy)

    // Check form against exercise reference
    if (exercise) {
      const formComparison = comparePoseWithForm(exercise.id)

      if (formComparison && formComparison.score < 70 && videoRef.current && !isPaused) {
        pauseExercise()

        // Provide feedback
        if (!isMuted && formComparison.feedback.length > 0) {
          speak(formComparison.feedback[0])
        }

        // Resume after 3 seconds
        setTimeout(() => {
          if (!isCompleted) {
            resumeExercise()
          }
        }, 3000)
      }

      // Check for repetition
      const repDetection = detectRepetition(exercise.type || "default")
      if (repDetection.isRepCompleted) {
        // Increase rep count, calorie count, etc.
        const newCalories = caloriesBurned + 1
        setCaloriesBurned(newCalories)

        // Provide audio feedback
        if (!isMuted) {
          speak(`Rep completed. ${repDetection.repQuality > 80 ? "Excellent form!" : "Keep going!"}`)
        }
      }
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
      stopSpeaking()
    }
  }, [])

  // Handle app state changes
  useEffect(() => {
    if (!isForeground || appState !== "active") {
      // Auto-pause when app goes to background
      if (isPlaying && !isPaused) {
        pauseExercise()
      }
    }
  }, [isForeground, appState, isPlaying, isPaused])

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
  const startExercise = useCallback(async () => {
    setIsPlaying(true)
    setShouldDetect(true)

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

      // Check if pose detection is stalled (no detections for 5 seconds)
      const now = Date.now()
      if (now - lastPoseTimeRef.current > 5000) {
        if (!isMuted) {
          speak("Please make sure you're visible in the camera frame.")
        }
        lastPoseTimeRef.current = now // Reset timer
      }
    }, 1000)
  }, [exercise])

  // Pause the exercise
  const pauseExercise = useCallback(async () => {
    setIsPaused(true)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (videoRef.current) {
      await videoRef.current.pauseAsync()
    }

    if (!isMuted) {
      speak("Exercise paused")
    }
  }, [])

  // Resume the exercise
  const resumeExercise = useCallback(async () => {
    setIsPaused(false)

    if (videoRef.current) {
      await videoRef.current.playAsync()
    }

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
  }, [exercise])

  // Reset the exercise
  const resetExercise = useCallback(async () => {
    setIsPaused(false)
    setIsPlaying(false)
    setCountdown(3)
    setElapsedTime(0)
    setCaloriesBurned(0)
    setShouldDetect(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

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
  }, [])

  // Complete the exercise
  const completeExercise = useCallback(async () => {
    if (isCompleted) return

    setIsCompleted(true)
    setShouldDetect(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

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
  }, [user, exercise, elapsedTime, accuracy, caloriesBurned, isCompleted])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
    if (isMuted) {
      speak("Voice feedback enabled")
    } else {
      speak("Voice feedback disabled", { force: true })
    }
  }, [isMuted])

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

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
    flex: 1,
    opacity: cameraOpacity.value,
  }))

  const videoContainerStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: insets.top + 10,
    right: 10,
    width: width * 0.3,
    height: ((width * 9) / 16) * 0.3,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 10,
    transform: [{ scale: videoScale.value }],
  }))

  const resultContainerStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }))

  if (isLoading || !exercise) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text preset="title">Loading exercise...</Text>
      </View>
    )
  }

  return (
    <VoiceCommandListener commands={exerciseCommands}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Camera View */}
        <Animated.View style={cameraContainerStyle}>
          <PoseDetectionCamera
            style={StyleSheet.absoluteFill}
            enabled={shouldDetect && isPlaying && !isPaused}
            showVisualization={true}
            minConfidence={0.5}
            resolution="medium"
          />

          {/* Pose accuracy indicator */}
          <View style={styles.accuracyContainer}>
            <Text preset="subtitle" style={styles.accuracyText}>
              Accuracy: {accuracy}%
            </Text>
            <View style={styles.accuracyBar}>
              <View
                style={[
                  styles.accuracyFill,
                  {
                    width: `${accuracy}%`,
                    backgroundColor: accuracy > 80 ? colors.success : accuracy > 60 ? colors.warning : colors.error,
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
            <Text preset="title" style={styles.exerciseName}>
              {exercise.name}
            </Text>

            {countdown > 0 && !isPlaying && !isPaused ? (
              <View style={styles.countdownContainer}>
                <Text preset="header" style={styles.countdownText}>
                  {countdown}
                </Text>
                <Text preset="subtitle" style={styles.getReadyText}>
                  Get Ready!
                </Text>
              </View>
            ) : (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text preset="caption" style={styles.statLabel}>
                    Time
                  </Text>
                  <Text preset="subtitle" style={styles.statValue}>
                    {formatTime(elapsedTime)} / {formatTime(exercise.duration)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text preset="caption" style={styles.statLabel}>
                    Calories
                  </Text>
                  <Text preset="subtitle" style={styles.statValue}>
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
                  style={[styles.controlButton, { backgroundColor: colors.primary }]}
                  onPress={() => setCountdown(3)}
                >
                  <Play size={24} color="#FFFFFF" />
                  <Text preset="button" style={{ color: "#FFFFFF", marginLeft: 8 }}>
                    Start Exercise
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Results */}
        <Animated.View style={resultContainerStyle}>
          <View style={[styles.resultCard, { backgroundColor: colors.background }]}>
            <Text preset="header" style={[styles.resultTitle, { color: colors.text }]}>
              Exercise Completed!
            </Text>

            <View style={styles.resultStats}>
              <View style={styles.resultStatItem}>
                <Text preset="caption" style={[styles.resultStatLabel, { color: colors.textMuted }]}>
                  Duration
                </Text>
                <Text preset="title" style={[styles.resultStatValue, { color: colors.primary }]}>
                  {formatTime(elapsedTime)}
                </Text>
              </View>

              <View style={styles.resultStatItem}>
                <Text preset="caption" style={[styles.resultStatLabel, { color: colors.textMuted }]}>
                  Accuracy
                </Text>
                <Text preset="title" style={[styles.resultStatValue, { color: colors.primary }]}>
                  {accuracy}%
                </Text>
              </View>

              <View style={styles.resultStatItem}>
                <Text preset="caption" style={[styles.resultStatLabel, { color: colors.textMuted }]}>
                  Calories
                </Text>
                <Text preset="title" style={[styles.resultStatValue, { color: colors.primary }]}>
                  {caloriesBurned}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.resultButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Check size={20} color="#FFFFFF" />
              <Text preset="button" style={styles.resultButtonText}>
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
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  muteButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  controlsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  infoContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  exerciseName: {
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  countdownContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 72,
  },
  getReadyText: {
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  statValue: {
    color: "#FFFFFF",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  controlButton: {
    minWidth: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  accuracyContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  accuracyText: {
    color: "#FFFFFF",
    marginBottom: 8,
  },
  accuracyBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  accuracyFill: {
    height: "100%",
    borderRadius: 4,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    alignItems: "center",
  },
  resultTitle: {
    marginBottom: 24,
  },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  resultStatItem: {
    alignItems: "center",
  },
  resultStatLabel: {
    marginBottom: 4,
  },
  resultStatValue: {
    color: "#0A84FF",
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
  },
  resultButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
  },
})

export default withVoiceEnabledScreen(EnhancedExerciseScreen)
