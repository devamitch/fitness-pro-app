"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Camera, useCameraDevices } from "react-native-vision-camera"
import { useTensorFlowCamera } from "@/hooks/useTensorFlowCamera"
import type { TensorFlowPoseData, ModelType } from "@/utils/tensorflowMediaService"
import { useTheme } from "@/hooks/useTheme"

interface TensorFlowPoseCameraProps {
  onPoseDetected?: (pose: TensorFlowPoseData) => void
  modelType?: ModelType
  skipFrames?: number
  scoreThreshold?: number
  renderOverlay?: (pose: TensorFlowPoseData | null) => React.ReactNode
  style?: any
}

export const TensorFlowPoseCamera: React.FC<TensorFlowPoseCameraProps> = ({
  onPoseDetected,
  modelType = "posenet",
  skipFrames = 3,
  scoreThreshold = 0.5,
  renderOverlay,
  style,
}) => {
  const { theme } = useTheme()
  const cameraRef = useRef<Camera>(null)
  const devices = useCameraDevices()
  const device = devices.back

  const [hasPermission, setHasPermission] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [currentPose, setCurrentPose] = useState<TensorFlowPoseData | null>(null)

  // Handle pose detection
  const handlePoseDetected = (pose: TensorFlowPoseData) => {
    setCurrentPose(pose)
    if (onPoseDetected) {
      onPoseDetected(pose)
    }
  }

  // Use TensorFlow camera hook
  const { frameProcessor, isInitialized, error } = useTensorFlowCamera(handlePoseDetected, {
    modelType,
    skipFrames,
    scoreThreshold,
    enabled: isActive,
  })

  // Request camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermission()
      setHasPermission(cameraPermission === "authorized")
    }

    requestPermissions()
  }, [])

  // Render loading state
  if (!device || !hasPermission) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {!device ? "Camera not available" : "Camera permission not granted"}
        </Text>
      </View>
    )
  }

  // Render initialization state
  if (!isInitialized) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>Initializing TensorFlow.js...</Text>
      </View>
    )
  }

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.text, { color: theme.colors.error }]}>Error: {error.message}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        frameProcessorFps={15}
      />

      {/* Render custom overlay */}
      {renderOverlay && renderOverlay(currentPose)}

      {/* Default overlay with keypoints */}
      {!renderOverlay && currentPose && (
        <View style={StyleSheet.absoluteFill}>
          {currentPose.keypoints.map((keypoint, index) => (
            <View
              key={index}
              style={[
                styles.keypoint,
                {
                  left: keypoint.x * 100 + "%",
                  top: keypoint.y * 100 + "%",
                  backgroundColor: `rgba(255, 0, 0, ${keypoint.score})`,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Camera controls */}
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.controlButtonText}>{isActive ? "Pause" : "Resume"}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
  keypoint: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  controlButton: {
    position: "absolute",
    bottom: 30,
    padding: 10,
    borderRadius: 5,
  },
  controlButtonText: {
    color: "white",
    fontWeight: "bold",
  },
})
