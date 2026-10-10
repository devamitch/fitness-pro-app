"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator, ScrollView } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { Canvas, useValue, runTiming } from "@shopify/react-native-skia"
import { Video } from "expo-av"
import * as Haptics from "expo-haptics"
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Camera,
  CheckCircle,
  XCircle,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react-native"

import { Text } from "../../components/ui/Text"
import { GlassMorphicCard } from "../../components/ui/GlassMorphicCard"
import { AnimatedButton } from "../../components/ui/AnimatedButton"
import { ProgressCircle } from "../../components/ui/ProgressCircle"
import { useTheme } from "../../hooks/useTheme"
import { useAuth } from "../../hooks/useAuth"
import { api } from "../../services/api"
import {
  TensorCamera,
  createDetector,
  processFrame,
  comparePoseWithReference,
  detectRepetition,
  calculateCaloriesBurned,
  PoseDetectionModel,
  type PoseData,
} from "../../services/mediaPipe"
import { useUserSettings } from "../../hooks/useUserSettings"
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant"

const { width, height } = Dimensions.get("window")
const isTablet = width >= 768

const PostureCorrectionScreen = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute()
  const { exerciseId } = route.params as { exerciseId: string }
  const { user } = useAuth()
  const { settings } = useUserSettings()
  const { speak, stopSpeaking } = useVoiceAssistant()
  const queryClient = useQueryClient()

  // Camera state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraType, setCameraType] = useState(Platform.OS === "ios" ? "front" : "back")

  // Exercise state
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [accuracy, setAccuracy] = useState(0)
  const [reps, setReps] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [formFeedback, setFormFeedback] = useState<string[]>([])
  const [previousPoses, setPreviousPoses] = useState<PoseData[]>([])

  // Refs
  const cameraRef = useRef(null)
  const videoRef = useRef<Video>(null)
  const detectorRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Animation values
  const infoCardHeight = useSharedValue(0)
  const pathOpacity = useValue(0)
  const pathProgress = useValue(0)
  const accuracyAnimValue = useSharedValue(0)
  const feedbackOpacity = useSharedValue(0)

  // Fetch exercise data
  const { data: exercise, isLoading: isLoadingExercise } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => api.exercise.getExerciseById(exerciseId),
  })

  // Fetch reference poses
  const { data: referencePoses, isLoading: isLoadingPoses } = useQuery({
    queryKey: ["referencePoses", exerciseId],
    queryFn: () => api.exercise.getReferencePoses(exerciseId),
  })

  // Save feedback mutation
  const saveFeedbackMutation = useMutation({
    mutationFn: (feedback: {
      exerciseId: string
      userId: string
      feedback: string
      score: number
    }) => api.aiCoach.saveFeedback(feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] })
    },
  })

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")

      // Initialize pose detector
      detectorRef.current = await createDetector(PoseDetectionModel.BlazePose, {
        enableSmoothing: true,
        modelComplexity: 2,
      })
    }

    initialize()

    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      stopSpeaking()
    }
  }, [])

  // Start timer when active
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1
          // Update calories burned
          if (exercise && user?.profile?.weight) {
            const newCalories = calculateCaloriesBurned(exercise.type, newTime, user.profile.weight, accuracy / 100)
            setCaloriesBurned(newCalories)
          }
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
  }, [isActive, isPaused, exercise, user])

  // Animate accuracy
  useEffect(() => {
    accuracyAnimValue.value = withTiming(accuracy / 100, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [accuracy])

  // Handle camera stream
  const handleCameraStream = async (images: IterableIterator<any>, updatePreview: () => void, gl: any) => {
    const loop = async () => {
      if (detectorRef.current && isActive && !isPaused && referencePoses?.length) {
        // Process frame
        const pose = await processFrame(detectorRef.current, images, gl, cameraType === "front")

        if (pose) {
          // Store pose for repetition detection
          setPreviousPoses((prev) => [...prev.slice(-9), pose])

          // Get current reference pose based on exercise phase
          const currentReferencePose = referencePoses[0] // Simplified, should select based on exercise phase

          // Compare with reference pose
          const comparison = comparePoseWithReference(pose, currentReferencePose)

          // Update accuracy
          setAccuracy(Math.round(comparison.score * 100))

          // Update form feedback
          if (comparison.formCorrections.length > 0) {
            setFormFeedback(comparison.formCorrections)

            // Show feedback with animation
            feedbackOpacity.value = withTiming(1, { duration: 300 })

            // Hide after 3 seconds
            setTimeout(() => {
              feedbackOpacity.value = withTiming(0, { duration: 300 })
            }, 3000)

            // Provide audio feedback if not muted
            if (!isMuted && comparison.score < 0.7) {
              speak(comparison.formCorrections[0])

              // Haptic feedback
              Haptics.notificationAsync(
                comparison.score < 0.5
                  ? Haptics.NotificationFeedbackType.Error
                  : Haptics.NotificationFeedbackType.Warning,
              )
            }
          }

          // Detect repetition
          if (previousPoses.length >= 10) {
            const isRepCompleted = detectRepetition(pose, previousPoses, exercise?.type || "default")

            if (isRepCompleted) {
              setReps((prev) => prev + 1)

              // Haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

              // Audio feedback
              if (!isMuted) {
                speak(`Rep ${reps + 1} completed. ${comparison.score > 0.8 ? "Great form!" : "Keep going!"}`)
              }
            }
          }
        }
      }

      requestAnimationFrame(loop)
    }

    loop()
  }

  // Handle start exercise
  const handleStartExercise = async () => {
    if (!exercise) return

    setIsActive(true)
    setIsPaused(false)

    // Start video if available
    if (videoRef.current) {
      await videoRef.current.playAsync()
    }

    // Provide audio instructions
    if (!isMuted) {
      speak(`Starting ${exercise.name}. ${exercise.instructions}`)
    }

    // Animate path
    runTiming(pathOpacity, 1, { duration: 500 })
    runTiming(pathProgress, 1, { duration: 2000 })

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  // Handle pause exercise
  const handlePauseExercise = async () => {
    setIsPaused(true)

    // Pause video if available
    if (videoRef.current) {
      await videoRef.current.pauseAsync()
    }

    // Stop audio
    stopSpeaking()

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  // Handle resume exercise
  const handleResumeExercise = async () => {
    setIsPaused(false)

    // Resume video if available
    if (videoRef.current) {
      await videoRef.current.playAsync()
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  // Handle reset exercise
  const handleResetExercise = () => {
    setIsActive(false)
    setIsPaused(false)
    setReps(0)
    setElapsedTime(0)
    setCaloriesBurned(0)
    setAccuracy(0)
    setPreviousPoses([])

    // Reset video if available
    if (videoRef.current) {
      videoRef.current.stopAsync()
      videoRef.current.setPositionAsync(0)
    }

    // Stop audio
    stopSpeaking()

    // Reset animations
    runTiming(pathOpacity, 0, { duration: 300 })
    runTiming(pathProgress, 0, { duration: 300 })

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }

  // Handle complete exercise
  const handleCompleteExercise = () => {
    // Save feedback
    if (user && exercise) {
      saveFeedbackMutation.mutate({
        exerciseId: exercise.id,
        userId: user.id,
        feedback: formFeedback.join(". "),
        score: accuracy,
      })
    }

    // Navigate to results
    navigation.navigate("ExerciseResults", {
      exerciseId: exercise?.id,
      duration: elapsedTime,
      reps,
      accuracy,
      caloriesBurned,
    })
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
      stopSpeaking()
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Animated styles
  const infoCardStyle = useAnimatedStyle(() => {
    return {
      height: infoCardHeight.value,
      opacity: infoCardHeight.value > 0 ? 1 : 0,
    }
  })

  const feedbackCardStyle = useAnimatedStyle(() => {
    return {
      opacity: feedbackOpacity.value,
      transform: [{ translateY: withTiming(feedbackOpacity.value * 20, { duration: 300 }) }],
    }
  })

  if (isLoadingExercise || isLoadingPoses) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading exercise...</Text>
      </View>
    )
  }

  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Exercise not found</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.buttonText }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{exercise.name}</Text>
        <TouchableOpacity style={styles.infoButton} onPress={handleToggleInfo}>
          <Info size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Camera / Exercise View */}
      <View style={styles.cameraContainer}>
        {hasPermission === false ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.card }]}>
            <Text style={{ textAlign: "center", color: theme.colors.text }}>
              Camera permission is required for pose detection.
            </Text>
          </View>
        ) : hasPermission === null ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.card }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <TensorCamera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              type={cameraType}
              onReady={handleCameraStream}
              autorender={true}
              resizeWidth={width}
              resizeHeight={height}
              resizeDepth={3}
            />

            {/* Pose overlay */}
            {isActive && (
              <Canvas style={StyleSheet.absoluteFill}>{/* Draw skeleton connections and keypoints here */}</Canvas>
            )}

            {/* Form feedback overlay */}
            <Animated.View style={[styles.feedbackContainer, feedbackCardStyle]}>
              <GlassMorphicCard
                style={[
                  styles.feedbackCard,
                  {
                    backgroundColor:
                      accuracy > 80
                        ? `${theme.colors.success}CC`
                        : accuracy > 50
                          ? `${theme.colors.warning}CC`
                          : `${theme.colors.error}CC`,
                  },
                ]}
              >
                <View style={styles.feedbackHeader}>
                  {accuracy > 80 ? <CheckCircle size={20} color="#FFFFFF" /> : <XCircle size={20} color="#FFFFFF" />}
                  <Text style={styles.feedbackTitle}>Form Accuracy: {accuracy}%</Text>
                </View>
                {formFeedback.length > 0 && <Text style={styles.feedbackText}>{formFeedback[0]}</Text>}
              </GlassMorphicCard>
            </Animated.View>
          </>
        )}

        {/* Exercise info overlay */}
        {!isActive && (
          <View style={styles.exerciseInfoOverlay}>
            <GlassMorphicCard style={styles.exerciseInfoCard}>
              <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>{exercise.name}</Text>
              <Text style={[styles.exerciseSubtitle, { color: theme.colors.textSecondary }]}>
                {exercise.muscle_group} • {exercise.difficulty}
              </Text>
              <Text style={[styles.exerciseDescription, { color: theme.colors.text }]}>{exercise.description}</Text>
              <AnimatedButton
                title="Start Exercise"
                onPress={handleStartExercise}
                style={{ backgroundColor: theme.colors.primary }}
                textStyle={{ color: theme.colors.buttonText }}
                icon={<Play size={20} color={theme.colors.buttonText} />}
              />
            </GlassMorphicCard>
          </View>
        )}

        {/* Video reference (if available) */}
        {exercise.video_url && (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: exercise.video_url }}
              style={styles.video}
              resizeMode="cover"
              isLooping
              shouldPlay={false}
            />
          </View>
        )}
      </View>

      {/* Stats Bar */}
      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom || 16,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Time</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Reps</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{reps}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Calories</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{caloriesBurned}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Accuracy</Text>
          <ProgressCircle
            progress={accuracyAnimValue}
            size={40}
            strokeWidth={4}
            progressColor={
              accuracy > 80 ? theme.colors.success : accuracy > 50 ? theme.colors.warning : theme.colors.error
            }
            backgroundColor={`${theme.colors.border}80`}
          >
            <Text style={[styles.accuracyText, { color: theme.colors.text }]}>{accuracy}%</Text>
          </ProgressCircle>
        </View>
      </View>

      {/* Controls */}
      {isActive && (
        <View
          style={[
            styles.controls,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.controlButton} onPress={handleToggleMute}>
            {isMuted ? (
              <VolumeX size={24} color={theme.colors.textSecondary} />
            ) : (
              <Volume2 size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setCameraType((prev) => (prev === "front" ? "back" : "front"))}
          >
            <Camera size={24} color={theme.colors.text} />
          </TouchableOpacity>
          {isPaused ? (
            <TouchableOpacity
              style={[styles.mainControlButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleResumeExercise}
            >
              <Play size={32} color={theme.colors.buttonText} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.mainControlButton, { backgroundColor: theme.colors.warning }]}
              onPress={handlePauseExercise}
            >
              <Pause size={32} color={theme.colors.buttonText} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.controlButton} onPress={handleToggleInfo}>
            <Info size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleResetExercise}>
            <RotateCcw size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Complete Button */}
      {isActive && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: theme.colors.success }]}
          onPress={handleCompleteExercise}
        >
          <Text style={[styles.completeButtonText, { color: theme.colors.buttonText }]}>Complete Exercise</Text>
        </TouchableOpacity>
      )}

      {/* Info Card */}
      <Animated.View style={[styles.infoCard, infoCardStyle]}>
        <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <ScrollView style={styles.infoScrollView} showsVerticalScrollIndicator={false}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Exercise Instructions</Text>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>{exercise.instructions}</Text>

          <Text style={[styles.infoTitle, { color: theme.colors.text, marginTop: 16 }]}>Target Muscles</Text>
          <View style={styles.musclesContainer}>
            {exercise.target_muscles?.map((muscle, index) => (
              <View key={index} style={[styles.muscleBadge, { backgroundColor: theme.colors.cardAlt }]}>
                <Text style={{ color: theme.colors.text }}>{muscle}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.infoTitle, { color: theme.colors.text, marginTop: 16 }]}>Benefits</Text>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>{exercise.benefits}</Text>
        </ScrollView>
        <TouchableOpacity
          style={[styles.closeInfoButton, { backgroundColor: theme.colors.card }]}
          onPress={handleToggleInfo}
        >
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
  videoContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 120,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
  },
  video: {
    width: "100%",
    height: "100%",
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
  exerciseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  exerciseSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  exerciseDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  feedbackContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  feedbackCard: {
    padding: 12,
    width: "90%",
    maxWidth: 400,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: "#FFFFFF",
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
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: "bold",
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
  completeButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
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
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
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
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
})

export default PostureCorrectionScreen
