"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Camera, useCameraDevices } from "react-native-vision-camera"
import { useSharedValue, withSpring, useAnimatedStyle, Animated } from "react-native-reanimated"
import { Canvas, Path, useValue, runTiming } from "@shopify/react-native-skia"
import { BlurView } from "expo-blur"
import { useQuery } from "@tanstack/react-query"
import { Text } from "../components/Text"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { AnimatedButton } from "../components/AnimatedButton"
import { useTheme } from "../theme/theme"
import { usePoseDetectionStore } from "../stores/poseDetectionStore"
import { useWorkoutStore } from "../stores/workoutStore"
import { useTTSStore } from "../stores/ttsStore"
import { exerciseApi } from "../services/api"
import { cacheManager } from "../utils/cacheManager"
import { screenSnapshotManager } from "../utils/screenSnapshotManager"
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  CheckCircle,
  XCircle,
  Info,
  X,
} from "lucide-react-native"

const { width, height } = Dimensions.get("window")
const isTablet = width >= 768

export const PremiumExerciseScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute()
  const { exerciseId } = route.params as { exerciseId: string }

  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [accuracy, setAccuracy] = useState(0)
  const [reps, setReps] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)

  const cameraRef = useRef<Camera>(null)
  const screenRef = useRef(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const devices = useCameraDevices()
  const device = devices.back

  // Animation values
  const infoCardHeight = useSharedValue(0)
  const pathOpacity = useValue(0)
  const pathProgress = useValue(0)

  // Pose detection store
  const { initializePoseDetection, startPoseDetection, stopPoseDetection, poseData, isPoseDetectionActive } =
    usePoseDetectionStore()

  // Workout store
  const { setCurrentExercise, startWorkout, pauseWorkout, resumeWorkout, resetWorkout, updateWorkoutStats } =
    useWorkoutStore()

  // TTS store
  const { speak, stop } = useTTSStore()

  // Fetch exercise data
  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: async () => {
      try {
        // Try to get from cache first
        const cached = await cacheManager.get(`exercise-${exerciseId}`)
        if (cached) return cached

        const data = await exerciseApi.getExerciseById(exerciseId)

        // Cache the result
        await cacheManager.set(`exercise-${exerciseId}`, data)

        return data
      } catch (error) {
        console.error("Error fetching exercise:", error)
        throw error
      }
    },
  })

  // Request camera permission
  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission()
      setCameraPermission(permission === "authorized")
    }

    requestCameraPermission()

    // Initialize pose detection
    initializePoseDetection()

    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      stopPoseDetection()
      stop()
    }
  }, [])

  // Set current exercise
  useEffect(() => {
    if (exercise) {
      setCurrentExercise(exercise)
    }
  }, [exercise])

  // Start timer when active
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1
          // Update calories burned (simplified calculation)
          const newCalories = Math.round((newTime / 60) * (exercise?.calories_per_min || 5))
          setCaloriesBurned(newCalories)
          return newTime
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, isPaused])

  // Update workout stats
  useEffect(() => {
    if (isActive) {
      updateWorkoutStats({
        duration: elapsedTime,
        caloriesBurned,
        accuracy,
      })
    }
  }, [elapsedTime, caloriesBurned, accuracy])

  // Process pose data
  useEffect(() => {
    if (poseData && isActive && !isPaused) {
      // Calculate pose accuracy (simplified)
      const newAccuracy = Math.min(Math.max(poseData.score * 100, 0), 100)
      setAccuracy(Math.round(newAccuracy))

      // Detect reps (simplified)
      if (poseData.isRepCompleted && poseData.score > 0.7) {
        setReps((prev) => prev + 1)

        // Provide audio feedback
        if (!isMuted) {
          speak(`Rep ${reps + 1} completed. Good form!`, { force: true })
        }
      }

      // Provide form correction feedback
      if (poseData.formCorrections && poseData.formCorrections.length > 0 && !isMuted) {
        speak(poseData.formCorrections[0], { force: true })
      }
    }
  }, [poseData])

  // Animated styles
  const infoCardStyle = useAnimatedStyle(() => {
    return {
      height: infoCardHeight.value,
      opacity: infoCardHeight.value > 0 ? 1 : 0,
    }
  })

  // Handle start exercise
  const handleStartExercise = async () => {
    if (!exercise) return

    setIsActive(true)
    setIsPaused(false)
    startWorkout()

    // Start pose detection
    if (cameraRef.current) {
      await startPoseDetection(cameraRef.current)
    }

    // Provide audio instructions
    if (!isMuted) {
      speak(`Starting ${exercise.name}. ${exercise.instructions}`, { force: true })
    }

    // Animate path
    runTiming(pathOpacity, 1, { duration: 500 })
    runTiming(pathProgress, 1, { duration: 2000 })
  }

  // Handle pause exercise
  const handlePauseExercise = () => {
    setIsPaused(true)
    pauseWorkout()

    // Pause pose detection
    stopPoseDetection()

    // Stop audio
    stop()
  }

  // Handle resume exercise
  const handleResumeExercise = async () => {
    setIsPaused(false)
    resumeWorkout()

    // Resume pose detection
    if (cameraRef.current) {
      await startPoseDetection(cameraRef.current)
    }
  }

  // Handle reset exercise
  const handleResetExercise = () => {
    setIsActive(false)
    setIsPaused(false)
    setReps(0)
    setElapsedTime(0)
    setCaloriesBurned(0)
    setAccuracy(0)
    resetWorkout()

    // Stop pose detection
    stopPoseDetection()

    // Stop audio
    stop()

    // Reset animations
    runTiming(pathOpacity, 0, { duration: 300 })
    runTiming(pathProgress, 0, { duration: 300 })
  }

  // Handle toggle info
  const handleToggleInfo = () => {
    infoCardHeight.value = withSpring(showInfo ? 0 : 300, { damping: 15, stiffness: 150 })
    setShowInfo(!showInfo)
  }

  // Handle toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      stop()
    }
  }

  // Handle take snapshot
  const handleTakeSnapshot = async () => {
    if (screenRef.current) {
      try {
        await screenSnapshotManager.captureScreen(screenRef.current, "Exercise", {
          exerciseId,
          timestamp: Date.now(),
          reps,
          accuracy,
          elapsedTime,
        })
      } catch (error) {
        console.error("Failed to capture screen:", error)
      }
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading || !exercise) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" style={{ marginTop: 16 }}>
          Loading exercise...
        </Text>
      </View>
    )
  }

  return (
    <View
      ref={screenRef}
      style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title">{exercise.name}</Text>
        <TouchableOpacity style={styles.infoButton} onPress={handleToggleInfo}>
          <Info size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Camera / Exercise View */}
      <View style={styles.cameraContainer}>
        {cameraPermission === false ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.background.secondary }]}>
            <Text variant="body" style={{ textAlign: "center" }}>
              Camera permission is required for pose detection.
            </Text>
          </View>
        ) : device == null ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.background.secondary }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isActive && !isPaused}
              enableZoomGesture
            />

            {/* Pose overlay */}
            {isActive && poseData && (
              <Canvas style={StyleSheet.absoluteFill}>
                {poseData.keypoints.map((keypoint, index) => {
                  // Draw keypoints and connections
                  const x = keypoint.x * width
                  const y = keypoint.y * height
                  const radius = 8
                  const color = keypoint.score > 0.5 ? "#00FF00" : "#FF0000"

                  return (
                    <Path
                      key={`keypoint-${index}`}
                      path={`M ${x - radius} ${y} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${
                        radius * 2
                      } 0`}
                      color={color}
                      style="fill"
                      opacity={pathOpacity}
                    />
                  )
                })}
              </Canvas>
            )}

            {/* Form feedback overlay */}
            {isActive && poseData && (
              <View style={styles.formFeedbackContainer}>
                <GlassMorphicCard
                  style={[
                    styles.formFeedbackCard,
                    {
                      backgroundColor:
                        accuracy > 80
                          ? "rgba(50, 215, 75, 0.7)"
                          : accuracy > 50
                            ? "rgba(255, 149, 0, 0.7)"
                            : "rgba(255, 59, 48, 0.7)",
                    },
                  ]}
                >
                  <View style={styles.formFeedbackHeader}>
                    {accuracy > 80 ? <CheckCircle size={20} color="#FFFFFF" /> : <XCircle size={20} color="#FFFFFF" />}
                    <Text variant="subtitle" style={{ color: "#FFFFFF", marginLeft: 8 }}>
                      Form Accuracy: {accuracy}%
                    </Text>
                  </View>
                  {poseData.formCorrections && poseData.formCorrections.length > 0 && (
                    <Text variant="caption" style={{ color: "#FFFFFF" }}>
                      {poseData.formCorrections[0]}
                    </Text>
                  )}
                </GlassMorphicCard>
              </View>
            )}
          </>
        )}

        {/* Exercise info overlay */}
        {!isActive && (
          <View style={styles.exerciseInfoOverlay}>
            <GlassMorphicCard style={styles.exerciseInfoCard}>
              <Text variant="header">{exercise.name}</Text>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary, marginBottom: 16 }}>
                {exercise.muscle_group} • {exercise.difficulty}
              </Text>
              <Text variant="body" style={{ marginBottom: 24 }}>
                {exercise.description}
              </Text>
              <AnimatedButton
                title="Start Exercise"
                onPress={handleStartExercise}
                variant="primary"
                size="large"
                icon={<Play size={20} color={theme.colors.text.inverse} />}
              />
            </GlassMorphicCard>
          </View>
        )}
      </View>

      {/* Stats Bar */}
      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: theme.colors.background.secondary,
            borderTopColor: theme.colors.card.border,
            paddingBottom: insets.bottom || 16,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            Time
          </Text>
          <Text variant="subtitle">{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            Reps
          </Text>
          <Text variant="subtitle">{reps}</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            Calories
          </Text>
          <Text variant="subtitle">{caloriesBurned}</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            Accuracy
          </Text>
          <Text variant="subtitle">{accuracy}%</Text>
        </View>
      </View>

      {/* Controls */}
      {isActive && (
        <View
          style={[
            styles.controls,
            {
              backgroundColor: theme.colors.background.secondary,
              borderTopColor: theme.colors.card.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.controlButton} onPress={handleToggleMute}>
            {isMuted ? (
              <VolumeX size={24} color={theme.colors.text.tertiary} />
            ) : (
              <Volume2 size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleTakeSnapshot}>
            <CameraIcon size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          {isPaused ? (
            <TouchableOpacity
              style={[styles.mainControlButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleResumeExercise}
            >
              <Play size={32} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.mainControlButton, { backgroundColor: theme.colors.status.warning }]}
              onPress={handlePauseExercise}
            >
              <Pause size={32} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.controlButton} onPress={handleToggleInfo}>
            <Info size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleResetExercise}>
            <RotateCcw size={24} color={theme.colors.status.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <Animated.View style={[styles.infoCard, infoCardStyle]}>
        <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <ScrollView style={styles.infoScrollView} showsVerticalScrollIndicator={false}>
          <Text variant="subtitle" style={{ marginBottom: 12 }}>
            Exercise Instructions
          </Text>
          <Text variant="body" style={{ marginBottom: 16 }}>
            {exercise.instructions}
          </Text>

          <Text variant="subtitle" style={{ marginBottom: 12 }}>
            Target Muscles
          </Text>
          <View style={styles.musclesContainer}>
            {exercise.target_muscles.map((muscle, index) => (
              <View key={index} style={[styles.muscleBadge, { backgroundColor: theme.colors.background.tertiary }]}>
                <Text variant="caption">{muscle}</Text>
              </View>
            ))}
          </View>

          <Text variant="subtitle" style={{ marginTop: 16, marginBottom: 12 }}>
            Benefits
          </Text>
          <Text variant="body" style={{ marginBottom: 16 }}>
            {exercise.benefits}
          </Text>

          {exercise.variations && exercise.variations.length > 0 && (
            <>
              <Text variant="subtitle" style={{ marginBottom: 12 }}>
                Variations
              </Text>
              {exercise.variations.map((variation, index) => (
                <View key={index} style={styles.variationItem}>
                  <Text variant="body" style={{ fontWeight: "600" }}>
                    {variation.name}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                    {variation.description}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        <TouchableOpacity
          style={[styles.closeInfoButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={handleToggleInfo}
        >
          <X size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  infoButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: isTablet ? 20 : 0,
    margin: isTablet ? 20 : 0,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  exerciseInfoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  exerciseInfoCard: {
    width: "100%",
    maxWidth: 500,
    padding: 24,
  },
  formFeedbackContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  formFeedbackCard: {
    padding: 12,
    width: "90%",
    maxWidth: 400,
  },
  formFeedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  controlButton: {
    padding: 12,
  },
  mainControlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  infoScrollView: {
    padding: 20,
    maxHeight: 400,
  },
  closeInfoButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  musclesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  muscleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  variationItem: {
    marginBottom: 12,
  },
})
