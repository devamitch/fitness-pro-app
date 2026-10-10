"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { PoseDetectionCamera } from "@/components/PoseDetectionCamera"
import type { PoseData, TensorFlowPoseData } from "@/services/pose/types"
import { GlassMorphicCard } from "@/components/ui/premium/GlassMorphicCard"
import { useTheme } from "@/hooks/useTheme"

interface PoseDetectionScreenProps {
  route: {
    params?: {
      engine?: "mediapipe" | "tensorflow"
    }
  }
}

const PoseDetectionScreen: React.FC<PoseDetectionScreenProps> = ({ route }) => {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const engine = route.params?.engine || "mediapipe"

  const [currentPose, setCurrentPose] = useState<PoseData | TensorFlowPoseData | null>(null)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showKeypoints, setShowKeypoints] = useState(true)

  // Handle pose detection
  const handlePoseDetected = useCallback((pose: PoseData | TensorFlowPoseData) => {
    setCurrentPose(pose)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <PoseDetectionCamera engine={engine} onPoseDetected={handlePoseDetected} style={styles.camera} />

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <GlassMorphicCard style={styles.controlsCard}>
          <View style={styles.controlsHeader}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Pose Detection</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>Engine: {engine}</Text>
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

export default PoseDetectionScreen
