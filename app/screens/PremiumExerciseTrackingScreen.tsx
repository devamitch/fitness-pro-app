"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { Camera, useCameraDevices } from "react-native-vision-camera"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from "react-native-reanimated"
import { BlurView } from "@react-native-community/blur"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { usePoseDetectionFrameProcessor } from "@/services/visionCamera"
import { aiCoach } from "@/services/aiCoach"
import { useTheme } from "@/hooks/useTheme"
import { GlassMorphicCard } from "@/components/ui/premium/GlassMorphicCard"
import { AnimatedButton } from "@/components/ui/premium/AnimatedButton"
import { Text } from "@/components/ui/Text"
import { VoiceVisualization } from "@/components/voice/VoiceVisualization"
import { AnimatedGradientBackground } from "@/components/AnimatedGradientBackground"
import { PoseDetection } from "@/components/exercise/PoseDetection"
import { AccuracyMeter } from "@/components/exercise/AccuracyMeter"
import { AnimatedInstructions } from "@/components/exercise/AnimatedInstructions"
import { useVoiceCommands } from "@/hooks/useVoiceCommands"
import { withVoiceCommands } from "@/hocs/withVoiceCommands"

const { width, height } = Dimensions.get("window")

interface PremiumExerciseTrackingScreenProps {
  route: {
    params: {
      exerciseId: string
      exerciseName: string
      instructions?: string
      difficulty?: "beginner" | "intermediate" | "advanced"
    }
  }
}

const PremiumExerciseTrackingScreen: React.FC<PremiumExerciseTrackingScreenProps> = ({ route }) => {
  const { exerciseId, exerciseName, instructions, difficulty = "intermediate" } = route.params
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const cameraRef = useRef<Camera>(null)
  const devices = useCameraDevices()
  const device = devices.back

  // State
  const [hasPermission, setHasPermission] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [accuracy, setAccuracy] = useState(0)
  const [feedback, setFeedback] = useState<string[]>([])
  const [repCount, setRepCount] = useState(0)
  const [setCount, setSetCount] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [showPoseOverlay, setShowPoseOverlay] = useState(true)

  // Animated values
  const animatedAccuracy = useSharedValue(0)
  const pulseValue = useSharedValue(1)
  const cardOpacity = useSharedValue(0.9)

  // Voice commands
  const { registerCommand, unregisterCommand } = useVoiceCommands()

  // Request camera permissions and initialize
  useEffect(() => {
    const initialize = async () => {
      const cameraPermission = await Camera.requestCameraPermission()
      setHasPermission(cameraPermission === "authorized")

      // Initialize AI Coach
      await aiCoach.initialize()
    }

    initialize()
  }, [])

  // Register voice commands
  useEffect(() => {
    registerCommand("start exercise", () => {
      if (!isActive) handleStartExercise()
    })

    registerCommand("stop exercise", () => {
      if (isActive) handleStopExercise()
    })

    registerCommand("toggle pose", () => {
      setShowPoseOverlay((prev) => !prev)
    })

    registerCommand("next set", () => {
      if (isActive) handleNextSet()
    })

    return () => {
      unregisterCommand("start exercise")
      unregisterCommand("stop exercise")
      unregisterCommand("toggle pose")
      unregisterCommand("next set")
    }
  }, [isActive])

  // Update rep and set count from AI Coach
  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive && !isResting) {
        setRepCount(aiCoach.getRepCount())
        setSetCount(aiCoach.getSetCount())
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isActive, isResting])

  // Handle rest timer
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isResting && restTimer > 0) {
      timer = setTimeout(() => {
        setRestTimer((prev) => prev - 1)
      }, 1000)
    } else if (isResting && restTimer === 0) {
      setIsResting(false)
      // Resume exercise monitoring
      aiCoach.startExerciseMonitoring(exerciseId, exerciseName)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isResting, restTimer, exerciseId, exerciseName])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        aiCoach.stopExerciseMonitoring()
      }
    }
  }, [isActive])

  // Animated styles
  const accuracyStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedAccuracy.value,
      [0, 50, 75, 100],
      [theme.colors.error, theme.colors.warning, theme.colors.success, theme.colors.primary],
    )

    return {
      backgroundColor,
    }
  })

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    }
  })

  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
    }
  })

  // Frame processor for pose detection
  const frameProcessor = usePoseDetectionFrameProcessor(
    (pose) => {
      if (isActive && !isResting && pose) {
        // Process the pose with AI Coach
        aiCoach.processFrame(pose)

        // Get feedback
        aiCoach.getExerciseFeedback(exerciseId, pose).then((feedback) => {
          setAccuracy(feedback.score)
          animatedAccuracy.value = withSpring(feedback.score)

          if (feedback.tips.length > 0) {
            setFeedback(feedback.tips)
          }

          // Update calories burned (simplified calculation)
          setCaloriesBurned((prev) => prev + 0.05)
        })
      }
    },
    { skipFrames: 5 },
  )

  // Handle starting the exercise
  const handleStartExercise = async () => {
    if (!device || !hasPermission) return

    const started = await aiCoach.startExerciseMonitoring(exerciseId, exerciseName)

    if (started) {
      setIsActive(true)
      pulseValue.value = withSpring(1.1, { damping: 10, stiffness: 100 }, () => {
        pulseValue.value = withSpring(1)
      })
    }
  }

  // Handle stopping the exercise
  const handleStopExercise = async () => {
    if (isActive) {
      await aiCoach.stopExerciseMonitoring()
      setIsActive(false)
      cardOpacity.value = withSpring(0.9)
    }
  }

  // Handle next set
  const handleNextSet = () => {
    if (isActive) {
      // Stop monitoring temporarily
      aiCoach.stopExerciseMonitoring()

      // Increment set count
      setSetCount((prev) => prev + 1)

      // Reset rep count
      setRepCount(0)

      // Start rest timer
      setIsResting(true)
      setRestTimer(60) // 60 seconds rest between sets
    }
  }

  // Render camera or placeholder
  const renderCamera = () => {
    if (device && hasPermission) {
      return (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          frameProcessorFps={15}
          audio={false}
          enableZoomGesture
        />
      )
    }

    return (
      <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholder]}>
        <Text style={styles.placeholderText}>Camera not available</Text>
      </View>
    )
  }

  // Render exercise info card
  const renderExerciseInfo = () => {
    return (
      <Animated.View style={[styles.infoContainer, cardStyle]}>
        <GlassMorphicCard style={styles.infoCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
              <Text style={styles.difficultyText}>{difficulty}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="repeat" size={24} color={theme.colors.text} />
              <Text style={styles.statValue}>{repCount}</Text>
              <Text style={styles.statLabel}>Reps</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.text} />
              <Text style={styles.statValue}>{setCount}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={24} color={theme.colors.text} />
              <Text style={styles.statValue}>{caloriesBurned.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>

          <AccuracyMeter accuracy={accuracy} style={styles.accuracyMeter} />

          {feedback.length > 0 && (
            <View style={styles.feedbackContainer}>
              <AnimatedInstructions text={feedback[0]} />
            </View>
          )}
        </GlassMorphicCard>
      </Animated.View>
    )
  }

  // Render rest timer overlay
  const renderRestTimer = () => {
    if (!isResting) return null

    return (
      <BlurView
        style={styles.restOverlay}
        blurType="dark"
        blurAmount={10}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.6)"
      >
        <Animated.View style={[styles.restCard, pulseStyle]}>
          <Text style={styles.restTitle}>Rest Time</Text>
          <Text style={styles.restTimer}>{restTimer}</Text>
          <Text style={styles.restSubtitle}>seconds</Text>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setIsResting(false)
              setRestTimer(0)
              aiCoach.startExerciseMonitoring(exerciseId, exerciseName)
            }}
          >
            <Text style={styles.skipButtonText}>Skip Rest</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    )
  }

  // Render controls
  const renderControls = () => {
    return (
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 20 }]}>
        {isActive ? (
          <View style={styles.activeControls}>
            <AnimatedButton
              icon={<Ionicons name="stop-circle" size={30} color="white" />}
              label="Stop"
              onPress={handleStopExercise}
              style={styles.controlButton}
              colors={["#f44336", "#d32f2f"]}
            />

            <AnimatedButton
              icon={<MaterialCommunityIcons name="dumbbell" size={30} color="white" />}
              label="Next Set"
              onPress={handleNextSet}
              style={styles.controlButton}
              colors={[theme.colors.primary, theme.colors.accent]}
            />

            <AnimatedButton
              icon={<Ionicons name={showPoseOverlay ? "eye-off" : "eye"} size={30} color="white" />}
              label={showPoseOverlay ? "Hide Pose" : "Show Pose"}
              onPress={() => setShowPoseOverlay(!showPoseOverlay)}
              style={styles.controlButton}
              colors={["#9c27b0", "#7b1fa2"]}
            />
          </View>
        ) : (
          <AnimatedButton
            icon={<Ionicons name="play" size={30} color="white" />}
            label="Start Exercise"
            onPress={handleStartExercise}
            style={styles.startButton}
            colors={["#4CAF50", "#2E7D32"]}
          />
        )}
      </View>
    )
  }

  // Get color based on difficulty
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "beginner":
        return "#4CAF50"
      case "intermediate":
        return "#FF9800"
      case "advanced":
        return "#F44336"
      default:
        return theme.colors.primary
    }
  }

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground
        colors={[theme.colors.background, theme.colors.card, theme.colors.primary + "40"]}
        style={StyleSheet.absoluteFill}
      />

      {renderCamera()}

      {showPoseOverlay && <PoseDetection style={StyleSheet.absoluteFill} />}

      <TouchableOpacity style={[styles.backButton, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
        <BlurView
          style={styles.backButtonBlur}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.6)"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </BlurView>
      </TouchableOpacity>

      {renderExerciseInfo()}
      {renderRestTimer()}
      {renderControls()}

      <VoiceVisualization
        style={[styles.voiceVisualization, { bottom: insets.bottom + 80 }]}
        type="wave"
        active={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraPlaceholder: {
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "white",
    fontSize: 18,
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  infoContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  infoCard: {
    padding: 15,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  difficultyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  accuracyMeter: {
    marginVertical: 15,
  },
  feedbackContainer: {
    marginTop: 10,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  activeControls: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  startButton: {
    width: "100%",
  },
  restOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  restCard: {
    width: width * 0.8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  restTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  restTimer: {
    fontSize: 60,
    fontWeight: "bold",
    color: "white",
  },
  restSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 20,
  },
  skipButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  skipButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  voiceVisualization: {
    position: "absolute",
    alignSelf: "center",
    width: 200,
    height: 40,
  },
})

export default withVoiceCommands(PremiumExerciseTrackingScreen)
