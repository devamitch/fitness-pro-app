"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { TensorFlowPoseCamera } from "@/components/TensorFlowPoseCamera"
import type { TensorFlowPoseData, ModelType } from "@/utils/tensorflowMediaService"
import { GlassMorphicCard } from "@/components/ui/premium/GlassMorphicCard"
import { useTheme } from "@/hooks/useTheme"
import Svg, { Line, Circle } from "react-native-svg"

interface TensorFlowPoseScreenProps {
  route: {
    params?: {
      modelType?: ModelType
    }
  }
}

const TensorFlowPoseScreen: React.FC<TensorFlowPoseScreenProps> = ({ route }) => {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const modelType = route.params?.modelType || "posenet"

  const [currentPose, setCurrentPose] = useState<TensorFlowPoseData | null>(null)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showKeypoints, setShowKeypoints] = useState(true)

  // Handle pose detection
  const handlePoseDetected = useCallback((pose: TensorFlowPoseData) => {
    setCurrentPose(pose)
  }, [])

  // Render pose skeleton overlay
  const renderPoseOverlay = useCallback(
    (pose: TensorFlowPoseData | null) => {
      if (!pose) return null

      // Define connections between keypoints for skeleton
      const connections = [
        // Face
        ["nose", "leftEye"],
        ["leftEye", "leftEar"],
        ["nose", "rightEye"],
        ["rightEye", "rightEar"],
        // Upper body
        ["leftShoulder", "rightShoulder"],
        ["leftShoulder", "leftElbow"],
        ["rightShoulder", "rightElbow"],
        ["leftElbow", "leftWrist"],
        ["rightElbow", "rightWrist"],
        // Torso
        ["leftShoulder", "leftHip"],
        ["rightShoulder", "rightHip"],
        ["leftHip", "rightHip"],
        // Lower body
        ["leftHip", "leftKnee"],
        ["rightHip", "rightKnee"],
        ["leftKnee", "leftAnkle"],
        ["rightKnee", "rightAnkle"],
      ]

      // Create a map of keypoints by name
      const keypointMap = pose.keypoints.reduce(
        (map, keypoint) => {
          map[keypoint.name] = keypoint
          return map
        },
        {} as Record<string, any>,
      )

      return (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox="0 0 1 1">
            {/* Draw skeleton */}
            {showSkeleton &&
              connections.map((connection, index) => {
                const [from, to] = connection
                const fromPoint = keypointMap[from]
                const toPoint = keypointMap[to]

                if (!fromPoint || !toPoint || fromPoint.score < 0.5 || toPoint.score < 0.5) {
                  return null
                }

                return (
                  <Line
                    key={`line-${index}`}
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={toPoint.x}
                    y2={toPoint.y}
                    stroke={theme.colors.primary}
                    strokeWidth="0.005"
                    strokeOpacity={Math.min(fromPoint.score, toPoint.score)}
                  />
                )
              })}

            {/* Draw keypoints */}
            {showKeypoints &&
              pose.keypoints.map((keypoint, index) => {
                if (keypoint.score < 0.5) return null

                return (
                  <Circle
                    key={`circle-${index}`}
                    cx={keypoint.x}
                    cy={keypoint.y}
                    r="0.01"
                    fill={theme.colors.accent}
                    fillOpacity={keypoint.score}
                  />
                )
              })}
          </Svg>
        </View>
      )
    },
    [showSkeleton, showKeypoints, theme],
  )

  return (
    <SafeAreaView style={styles.container}>
      <TensorFlowPoseCamera
        modelType={modelType}
        skipFrames={3}
        scoreThreshold={0.5}
        onPoseDetected={handlePoseDetected}
        renderOverlay={renderPoseOverlay}
        style={styles.camera}
      />

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <GlassMorphicCard style={styles.controlsCard}>
          <View style={styles.controlsHeader}>
            <Text style={[styles.title, { color: theme.colors.text }]}>TensorFlow Pose Detection</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>Model: {modelType}</Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowSkeleton(!showSkeleton)}
            >
              <Text style={styles.controlButtonText}>{showSkeleton ? "Hide Skeleton" : "Show Skeleton"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowKeypoints(!showKeypoints)}
            >
              <Text style={styles.controlButtonText}>{showKeypoints ? "Hide Keypoints" : "Show Keypoints"}</Text>
            </TouchableOpacity>
          </View>

          {currentPose && (
            <View style={styles.statsContainer}>
              <Text style={[styles.statsText, { color: theme.colors.text }]}>
                Confidence: {(currentPose.score * 100).toFixed(1)}%
              </Text>
              <Text style={[styles.statsText, { color: theme.colors.text }]}>
                Keypoints: {currentPose.keypoints.filter((kp) => kp.score > 0.5).length}/{currentPose.keypoints.length}
              </Text>
            </View>
          )}
        </GlassMorphicCard>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: theme.colors.card }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  controlsCard: {
    padding: 15,
  },
  controlsHeader: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  controlButton: {
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
    alignItems: "center",
  },
  controlButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  statsContainer: {
    marginTop: 10,
  },
  statsText: {
    fontSize: 14,
    marginBottom: 5,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default TensorFlowPoseScreen
