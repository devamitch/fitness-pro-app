"use client"

import React, { useState, useRef, useCallback } from "react"
import { StyleSheet, View } from "react-native"
import { useSharedValue } from "react-native-reanimated"
import { Camera, useCameraDevices, type CameraDeviceFormat, type CameraRuntimeError } from "react-native-vision-camera"
import { usePoseDetection } from "../hooks/usePoseDetection"
import { PoseVisualization } from "./PoseVisualization"
import type { PoseData } from "../services/pose-detection/types"
import Text from "./Text"

interface PoseDetectionCameraProps {
  onPoseDetected?: (pose: PoseData) => void
  minConfidence?: number
  showVisualization?: boolean
  style?: any
  enabled?: boolean
  resolution?: "low" | "medium" | "high"
  fps?: number
}

/**
 * PoseDetectionCamera - A camera component that detects poses
 */
export const PoseDetectionCamera: React.FC<PoseDetectionCameraProps> = ({
  onPoseDetected,
  minConfidence = 0.5,
  showVisualization = true,
  style,
  enabled = true,
  resolution = "medium",
  fps = 30,
}) => {
  // Camera ref
  const camera = useRef<Camera>(null)

  // Camera devices
  const devices = useCameraDevices()
  const device = devices.back

  // Camera permissions
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  // Current pose data
  const [pose, setPose] = useState<PoseData | null>(null)

  // Camera error
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Animated values for visualization
  const visualizationOpacity = useSharedValue(1)

  // Use pose detection hook
  const {
    processFrame,
    isInitialized,
    isDetecting,
    error: poseError,
  } = usePoseDetection({
    enabled,
    minConfidence,
    onPoseDetected: (detectedPose) => {
      setPose(detectedPose)
      if (onPoseDetected) {
        onPoseDetected(detectedPose)
      }
    },
  })

  // Request camera permissions
  const requestCameraPermission = useCallback(async () => {
    const permission = await Camera.requestCameraPermission()
    setHasPermission(permission === "granted")
  }, [])

  // Effect to request camera permission
  React.useEffect(() => {
    requestCameraPermission()
  }, [requestCameraPermission])

  // Handle camera errors
  const onCameraError = useCallback((error: CameraRuntimeError) => {
    console.error("Camera error:", error)
    setCameraError(`Camera error: ${error.message}`)
  }, [])

  // Format selector for camera
  const formatSelector = useCallback(
    (formats: CameraDeviceFormat[]) => {
      // Find the desired resolution
      let targetWidth: number

      switch (resolution) {
        case "low":
          targetWidth = 640
          break
        case "medium":
          targetWidth = 1280
          break
        case "high":
          targetWidth = 1920
          break
        default:
          targetWidth = 1280
      }

      // Find the format closest to our target resolution with the desired FPS
      return formats
        .filter((f) => f.frameRateRanges.some((range) => range.maxFrameRate >= fps))
        .sort((a, b) => {
          const aDiff = Math.abs(a.videoWidth - targetWidth)
          const bDiff = Math.abs(b.videoWidth - targetWidth)
          return aDiff - bDiff
        })[0]
    },
    [resolution, fps],
  )

  // Render loading state
  if (hasPermission === null) {
    return (
      <View style={[styles.container, style]}>
        <Text>Requesting camera permission...</Text>
      </View>
    )
  }

  // Render permission denied state
  if (hasPermission === false) {
    return (
      <View style={[styles.container, style]}>
        <Text>No access to camera</Text>
      </View>
    )
  }

  // Render error state
  if (cameraError || poseError) {
    return (
      <View style={[styles.container, style]}>
        <Text>{cameraError || poseError?.message}</Text>
      </View>
    )
  }

  // Render loading state
  if (!device) {
    return (
      <View style={[styles.container, style]}>
        <Text>Loading camera...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isDetecting}
        frameProcessor={processFrame}
        frameProcessorFps={fps}
        onError={onCameraError}
        format={formatSelector}
        video={true}
        photo={false}
        enableZoomGesture
        enableHighQualityPhotos={false}
      />

      {showVisualization && pose && (
        <PoseVisualization pose={pose} opacity={visualizationOpacity} style={StyleSheet.absoluteFill} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
})
