"use client"

import { SOUNDS } from "@/assets/images"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { Audio, Video } from "expo-av"
import { Camera } from "expo-camera"
import { ArrowLeft, Check, Pause, Play, RotateCcw } from "lucide-react-native"
import { useEffect, useRef, useState } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { exerciseApi, progressApi } from "../services/api"
import {
  TensorCamera,
  calculatePoseSimilarity,
  createDetector,
  processFrame,
} from "../services/mediaPipe"
import { useAuthStore } from "../stores/authStore"

const { width, height } = Dimensions.get("window")

type ExerciseScreenRouteProp = RouteProp<
  {
    Exercise: { exerciseId: string }
  },
  "Exercise"
>

export const ExerciseScreen = () => {
  const route = useRoute<ExerciseScreenRouteProp>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const cameraRef = useRef<Camera>(null)
  const videoRef = useRef<Video>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const detectorRef = useRef<any>(null)

  const videoScale = useSharedValue(0.3)
  const cameraOpacity = useSharedValue(0)
  const resultScale = useSharedValue(0.8)
  const resultOpacity = useSharedValue(0)

  // Fetch exercise data
  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", route.params.exerciseId],
    queryFn: () => exerciseApi.getExerciseById(route.params.exerciseId),
  })

  // Request camera permissions
  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")

      // Initialize pose detector
      detectorRef.current = await createDetector()
    })()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [])

  // Handle countdown
  useEffect(() => {
    if (countdown > 0 && !isPaused) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (countdown === 0 && !isPlaying && !isPaused) {
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

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1

        // Calculate calories (simplified)
        const newCalories = Math.floor(newTime / 10)
        setCaloriesBurned(newCalories)

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
  }

  // Resume the exercise
  const resumeExercise = async () => {
    setIsPaused(false)

    if (videoRef.current) {
      await videoRef.current.playAsync()
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1

        // Calculate calories (simplified)
        const newCalories = Math.floor(newTime / 10)
        setCaloriesBurned(newCalories)

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
  }

  // Complete the exercise
  const completeExercise = async () => {
    if (isCompleted) return

    setIsCompleted(true)

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
  }

  // Handle pose detection
  const handleCameraStream = async (
    images: IterableIterator<any>,
    updatePreview: () => void,
    gl: any,
  ) => {
    const loop = async () => {
      if (detectorRef.current && exercise && isPlaying && !isPaused && !isCompleted) {
        const pose = await processFrame(detectorRef.current, images, gl)

        if (pose && exercise.target_poses) {
          // Get current target pose based on elapsed time
          const targetPoseIndex = Math.min(
            Math.floor(elapsedTime / 5), // Change target pose every 5 seconds
            exercise.target_poses.length - 1,
          )

          const targetPose = exercise.target_poses[targetPoseIndex]

          // Calculate similarity
          const similarity = calculatePoseSimilarity(pose, targetPose)
          setAccuracy(similarity)

          // Pause video if pose is wrong (similarity < 0.6)
          if (similarity < 0.6 && videoRef.current && isPlaying && !isPaused) {
            await videoRef.current.pauseAsync()
            setIsPaused(true)

            // Play error sound
            try {
              const { sound } = await Audio.Sound.createAsync(SOUNDS.remote)
              soundRef.current = sound
              await sound.playAsync()
            } catch (error) {
              console.log("Error playing sound", error)
            }

            // Resume after 2 seconds
            setTimeout(() => {
              if (videoRef.current && !isCompleted) {
                videoRef.current.playAsync()
                setIsPaused(false)
              }
            }, 2000)
          }
        }
      }

      requestAnimationFrame(loop)
    }

    loop()
  }

  // Animated styles
  const videoContainerStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: insets.top + 10,
      right: 10,
      width: width * videoScale.value,
      height: ((width * 9) / 16) * videoScale.value,
      borderRadius: 12,
      overflow: "hidden",
      zIndex: 10,
    }
  })

  const cameraContainerStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      opacity: cameraOpacity.value,
    }
  })

  const resultContainerStyle = useAnimatedStyle(() => {
    return {
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
    }
  })

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading || !exercise) {
    return (
      <View style={styles.container}>
        <Text variant="title">Loading exercise...</Text>
      </View>
    )
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text variant="title">Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text variant="title">No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text variant="button">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Animated.View style={cameraContainerStyle}>
        <TensorCamera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.front}
          onReady={handleCameraStream}
          autorender={true}
          resizeWidth={width}
          resizeHeight={height}
          resizeDepth={3}
        />

        {/* Pose accuracy indicator */}
        <View style={styles.accuracyContainer}>
          <Text variant="subtitle" style={styles.accuracyText}>
            Accuracy: {Math.round(accuracy * 100)}%
          </Text>
          <View style={styles.accuracyBar}>
            <View
              style={[
                styles.accuracyFill,
                {
                  width: `${accuracy * 100}%`,
                  backgroundColor:
                    accuracy > 0.8 ? "#32D74B" : accuracy > 0.6 ? "#FF9500" : "#FF3B30",
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
          style={[styles.backButton, { top: insets.top || 20 }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Exercise info */}
        <View style={styles.infoContainer}>
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
                  style={styles.controlButton}
                  onPress={isPaused ? resumeExercise : pauseExercise}
                >
                  {isPaused ? (
                    <Play size={24} color="#FFFFFF" />
                  ) : (
                    <Pause size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={resetExercise}>
                  <RotateCcw size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* Results */}
      <Animated.View style={resultContainerStyle}>
        <View style={styles.resultCard}>
          <Text variant="header" style={styles.resultTitle}>
            Exercise Completed!
          </Text>

          <View style={styles.resultStats}>
            <View style={styles.resultStatItem}>
              <Text variant="caption" style={styles.resultStatLabel}>
                Duration
              </Text>
              <Text variant="title" style={styles.resultStatValue}>
                {formatTime(elapsedTime)}
              </Text>
            </View>

            <View style={styles.resultStatItem}>
              <Text variant="caption" style={styles.resultStatLabel}>
                Accuracy
              </Text>
              <Text variant="title" style={styles.resultStatValue}>
                {Math.round(accuracy * 100)}%
              </Text>
            </View>

            <View style={styles.resultStatItem}>
              <Text variant="caption" style={styles.resultStatLabel}>
                Calories
              </Text>
              <Text variant="title" style={styles.resultStatValue}>
                {caloriesBurned}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.resultButton} onPress={() => navigation.goBack()}>
            <Check size={20} color="#FFFFFF" />
            <Text variant="button" style={styles.resultButtonText}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  accuracyBar: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    height: 8,
    overflow: "hidden",
  },
  accuracyContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    left: 20,
    padding: 12,
    position: "absolute",
    right: 20,
    top: 100,
  },
  accuracyFill: {
    borderRadius: 4,
    height: "100%",
  },
  accuracyText: {
    color: "#FFFFFF",
    marginBottom: 8,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    left: 20,
    position: "absolute",
    width: 40,
    zIndex: 10,
  },
  button: {
    backgroundColor: "#0A84FF",
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  camera: {
    flex: 1,
  },
  container: {
    backgroundColor: "#000000",
    flex: 1,
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    marginHorizontal: 10,
    width: 60,
  },
  controlsContainer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    position: "absolute",
    right: 0,
  },
  countdownContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 72,
  },
  exerciseName: {
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  getReadyText: {
    color: "#FFFFFF",
  },
  infoContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
  },
  resultButton: {
    alignItems: "center",
    backgroundColor: "#0A84FF",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: "100%",
  },
  resultButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
  },
  resultCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
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
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    width: "100%",
  },
  resultTitle: {
    marginBottom: 24,
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
  },
})
