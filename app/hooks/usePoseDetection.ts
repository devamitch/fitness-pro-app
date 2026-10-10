"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Frame } from "react-native-vision-camera"
import { poseDetection } from "../services/pose-detection"
import type { PoseData } from "../services/pose-detection/types"

interface UsePoseDetectionOptions {
  enabled?: boolean
  onPoseDetected?: (pose: PoseData) => void
  minConfidence?: number
}

/**
 * usePoseDetection - Custom hook for using pose detection in React components
 */
export function usePoseDetection(options: UsePoseDetectionOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [currentPose, setCurrentPose] = useState<PoseData | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Keep the last N poses for analysis
  const POSE_HISTORY_LENGTH = 10
  const poseHistoryRef = useRef<PoseData[]>([])

  // Options
  const { enabled = false, onPoseDetected, minConfidence = 0.5 } = options

  // Initialize pose detection
  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await poseDetection.initialize()
        setIsInitialized(success)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize pose detection"))
      }
    }

    initialize()
  }, [])

  // Process a frame
  const processFrame = useCallback(
    async (frame: Frame): Promise<void> => {
      if (!isInitialized || !isDetecting) return

      try {
        const pose = await poseDetection.detectPosesInFrame(frame)

        if (pose && pose.score >= minConfidence) {
          // Update current pose
          setCurrentPose(pose)

          // Update pose history
          poseHistoryRef.current = [pose, ...poseHistoryRef.current].slice(0, POSE_HISTORY_LENGTH)

          // Call callback if provided
          if (onPoseDetected) {
            onPoseDetected(pose)
          }
        }
      } catch (err) {
        console.error("Error processing frame:", err)
      }
    },
    [isInitialized, isDetecting, minConfidence, onPoseDetected],
  )

  // Start detection
  const startDetection = useCallback(async () => {
    if (!isInitialized) {
      try {
        const success = await poseDetection.initialize()
        setIsInitialized(success)
        if (!success) return false
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to initialize pose detection on demand"),
        )
        return false
      }
    }

    setIsDetecting(true)
    return true
  }, [isInitialized])

  // Stop detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false)
    return true
  }, [])

  // Compare current pose with exercise form
  const comparePoseWithForm = useCallback(
    (exerciseId: string) => {
      if (!currentPose) return null

      return poseDetection.comparePoseWithForm(currentPose, exerciseId)
    },
    [currentPose],
  )

  // Detect repetition
  const detectRepetition = useCallback(
    (exerciseType: string) => {
      if (!currentPose || poseHistoryRef.current.length < 5) {
        return { isRepCompleted: false, repQuality: 0 }
      }

      return poseDetection.detectRepetition(
        currentPose,
        poseHistoryRef.current.slice(1), // Skip current pose as it's already passed separately
        exerciseType,
      )
    },
    [currentPose],
  )

  // Enable/disable detection based on options
  useEffect(() => {
    if (enabled && isInitialized && !isDetecting) {
      startDetection()
    } else if (!enabled && isDetecting) {
      stopDetection()
    }
  }, [enabled, isInitialized, isDetecting, startDetection, stopDetection])

  return {
    isInitialized,
    isDetecting,
    currentPose,
    poseHistory: poseHistoryRef.current,
    error,
    processFrame,
    startDetection,
    stopDetection,
    comparePoseWithForm,
    detectRepetition,
  }
}
