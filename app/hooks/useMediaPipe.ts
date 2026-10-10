"use client"

import * as poseDetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs"
import { useEffect, useState } from "react"

export interface MediaPipeHookResult {
  detector: poseDetection.PoseDetector | null
  pose: poseDetection.Pose | null
  isLoading: boolean
  error: Error | null
}

export const useMediaPipe = (): MediaPipeHookResult => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null)
  const [pose] = useState<poseDetection.Pose | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Initialize TensorFlow.js and pose detector
  useEffect(() => {
    const initTF = async () => {
      try {
        setIsLoading(true)

        // Initialize TensorFlow.js
        await tf.ready()

        // Create pose detector
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        }

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig,
        )

        setDetector(detector)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize TensorFlow.js"))
        setIsLoading(false)
      }
    }

    initTF()

    return () => {
      // Clean up detector if needed
      if (detector) {
        // No explicit dispose method in the type, but good practice to clean up
        // if one becomes available in the future
      }
    }
  }, [])

  return { detector, pose, isLoading, error }
}
